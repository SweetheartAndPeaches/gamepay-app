import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyToken } from '@/lib/jwt';
import { generateSignature, generateMchOrderNo } from '@/lib/payin-signature';
import { PAYIN_PLATFORM_CONFIG, UnifiedOrderRequest, UnifiedOrderResponse, OrderState } from '@/lib/payin-config';
import { isPayinConfigValid } from '@/lib/payin-config';

/**
 * 创建代收订单API
 * 用户选择代收账户和金额后，调用此API创建代收订单
 */
interface CreateOrderRequest {
  /** 代收账户ID列表（支持多选） */
  accountIds: string[];
  /** 代收金额（单位：元） */
  amount: number;
  /** 支付方式（如：COLOMBIA_QR、MILURU_QR） */
  paymentMethod?: string;
}

export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json(
        { success: false, message: '未授权访问' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, message: 'Token 无效或已过期' },
        { status: 401 }
      );
    }

    const body: CreateOrderRequest = await request.json();
    const { accountIds, amount, paymentMethod = 'COLOMBIA_QR' } = body;

    // 验证参数
    if (!accountIds || !Array.isArray(accountIds) || accountIds.length === 0) {
      return NextResponse.json(
        { success: false, message: '请至少选择一个代收账户' },
        { status: 400 }
      );
    }

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, message: '代收金额必须大于 0' },
        { status: 400 }
      );
    }

    // 验证支付平台配置
    if (!isPayinConfigValid()) {
      console.error('Payin platform config invalid:', {
        apiUrl: PAYIN_PLATFORM_CONFIG.apiUrl,
        mchNo: PAYIN_PLATFORM_CONFIG.mchNo ? 'configured' : 'missing',
        appId: PAYIN_PLATFORM_CONFIG.appId ? 'configured' : 'missing',
        privateKey: PAYIN_PLATFORM_CONFIG.privateKey ? 'configured' : 'missing',
      });
      return NextResponse.json(
        { success: false, message: '支付平台配置不完整，请联系管理员配置支付平台参数' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();

    // 检查代收任务是否开启
    const { data: setting, error: settingError } = await client
      .from('system_settings')
      .select('value')
      .eq('key', 'payin.enabled')
      .single();

    if (settingError || !setting || setting.value !== 'true') {
      return NextResponse.json(
        { success: false, message: '代收任务暂未开启' },
        { status: 400 }
      );
    }

    // 检查用户是否已有未完成的订单
    const { data: activeOrder, error: activeOrderError } = await client
      .from('payin_orders')
      .select('*')
      .eq('user_id', payload.userId)
      .in('status', ['created', 'paying'])
      .maybeSingle();

    if (activeOrderError) {
      console.error('Get active order error:', activeOrderError);
      return NextResponse.json(
        { success: false, message: '获取订单状态失败' },
        { status: 500 }
      );
    }

    if (activeOrder) {
      return NextResponse.json(
        { success: false, message: '您当前有未完成的订单，请先完成后再创建新订单' },
        { status: 400 }
      );
    }

    // 检查用户余额是否充足
    const { data: user, error: userError } = await client
      .from('users')
      .select('balance, frozen_balance')
      .eq('id', payload.userId)
      .single();

    if (userError || !user) {
      console.error('Get user error:', userError);
      return NextResponse.json(
        { success: false, message: '获取用户信息失败' },
        { status: 500 }
      );
    }

    const userBalance = parseFloat(user.balance.toString());
    if (userBalance < amount) {
      return NextResponse.json(
        { success: false, message: `余额不足，需要 ${amount} 元，当前余额 ${userBalance} 元` },
        { status: 400 }
      );
    }

    // 检查所有代收账户是否属于当前用户
    const { data: accounts, error: accountsError } = await client
      .from('payment_accounts')
      .select('*')
      .in('id', accountIds)
      .eq('user_id', payload.userId)
      .eq('is_active', true)
      .eq('payin_enabled', true);

    if (accountsError || !accounts || accounts.length === 0) {
      return NextResponse.json(
        { success: false, message: '代收账户不存在或未启用代收' },
        { status: 404 }
      );
    }

    // 检查是否所有账户都有效
    if (accounts.length !== accountIds.length) {
      return NextResponse.json(
        { success: false, message: '部分代收账户无效或未启用代收' },
        { status: 400 }
      );
    }

    // 使用第一个账户作为主要账户
    const primaryAccount = accounts[0];

    // 计算佣金（假设佣金率为 5%）
    const commission = amount * 0.05;

    // 生成订单号
    const orderNo = generateMchOrderNo('PAYIN');

    // 计算订单过期时间（默认30分钟）
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    // 冻结用户余额
    const frozenBalance = parseFloat((user as any).frozen_balance?.toString() || '0');
    const newBalance = userBalance - amount;
    const newFrozenBalance = frozenBalance + amount;

    const { error: updateBalanceError } = await client
      .from('users')
      .update({
        balance: newBalance,
        frozen_balance: newFrozenBalance,
        updated_at: new Date().toISOString(),
      })
      .eq('id', payload.userId);

    if (updateBalanceError) {
      console.error('Update balance error:', updateBalanceError);
      return NextResponse.json(
        { success: false, message: '扣减余额失败' },
        { status: 500 }
      );
    }

    // 记录余额变动（冻结）
    await client.from('balance_records').insert({
      user_id: payload.userId,
      type: 'freeze',
      amount: amount,
      balance_after: newBalance,
      description: `代收订单冻结（订单号：${orderNo}）`,
      related_order_id: orderNo,
    });

    // 创建本地订单记录
    const { data: order, error: createOrderError } = await client
      .from('payin_orders')
      .insert({
        user_id: payload.userId,
        account_id: primaryAccount.id,
        order_no: orderNo,
        amount: amount,
        commission: commission,
        status: 'created',
        payment_method: paymentMethod,
        payment_currency: paymentMethod === 'MILURU_QR' ? 'PEN' : 'COP',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (createOrderError) {
      console.error('Create order error:', createOrderError);
      // 回滚余额
      await client
        .from('users')
        .update({
          balance: userBalance,
          frozen_balance: frozenBalance,
          updated_at: new Date().toISOString(),
        })
        .eq('id', payload.userId);

      return NextResponse.json(
        { success: false, message: '创建订单失败' },
        { status: 500 }
      );
    }

    // 调用支付平台接口创建订单
    try {
      // 获取客户端IP
      const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                       request.headers.get('x-real-ip') ||
                       '127.0.0.1';

      const platformOrder = await callPlatformUnifiedOrder({
        mchOrderNo: orderNo,
        amount: Math.round(amount * 100), // 转换为分
        wayCode: paymentMethod,
        currency: paymentMethod === 'MILURU_QR' ? 'PEN' : 'COP',
        subject: `代收订单 ${orderNo}`,
        body: `代收订单 ${orderNo}`,
        clientIp: clientIp,
      });

      // 更新本地订单，保存支付平台订单信息
      const { error: updateOrderError } = await client
        .from('payin_orders')
        .update({
          pay_order_id: platformOrder.payOrderId,
          payment_data: JSON.stringify(platformOrder),
          status: platformOrder.orderState === OrderState.SUCCESS ? 'success' : 'paying',
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      if (updateOrderError) {
        console.error('Update order error:', updateOrderError);
        // 不影响主流程，只记录错误
      }

      return NextResponse.json({
        success: true,
        message: '创建订单成功',
        data: {
          order: {
            ...order,
            pay_order_id: platformOrder.payOrderId,
            payment_data: platformOrder,
            status: platformOrder.orderState === OrderState.SUCCESS ? 'success' : 'paying',
          },
        },
      });
    } catch (platformError) {
      console.error('Call platform API error:', platformError);

      // 支付平台调用失败，标记订单为失败
      await client
        .from('payin_orders')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      // 回滚余额
      await client
        .from('users')
        .update({
          balance: userBalance,
          frozen_balance: frozenBalance,
          updated_at: new Date().toISOString(),
        })
        .eq('id', payload.userId);

      // 记录余额变动（解冻）
      await client.from('balance_records').insert({
        user_id: payload.userId,
        type: 'unfreeze',
        amount: amount,
        balance_after: userBalance,
        description: `代收订单创建失败，解冻余额（订单号：${orderNo}）`,
        related_order_id: orderNo,
      });

      return NextResponse.json(
        {
          success: false,
          message: '调用支付平台接口失败，订单已取消',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}

/**
 * 调用支付平台统一代收接口
 */
async function callPlatformUnifiedOrder(params: {
  mchOrderNo: string;
  amount: number;
  wayCode: string;
  currency: string;
  subject: string;
  body: string;
  clientIp: string;
}): Promise<{
  payOrderId: string;
  orderState: number;
  payData?: string;
  [key: string]: any;
}> {
  const reqTime = Date.now();

  // 构造请求参数
  const requestParams: UnifiedOrderRequest = {
    mchNo: PAYIN_PLATFORM_CONFIG.mchNo,
    appId: PAYIN_PLATFORM_CONFIG.appId,
    mchOrderNo: params.mchOrderNo,
    wayCode: params.wayCode,
    amount: params.amount,
    currency: params.currency,
    subject: params.subject,
    body: params.body,
    notifyUrl: PAYIN_PLATFORM_CONFIG.notifyUrl,
    returnUrl: PAYIN_PLATFORM_CONFIG.returnUrl,
    reqTime: reqTime,
    version: PAYIN_PLATFORM_CONFIG.version,
    signType: PAYIN_PLATFORM_CONFIG.signType,
    clientIp: params.clientIp,
    sign: '', // 签名稍后生成
  };

  // 生成签名
  requestParams.sign = generateSignature(requestParams, PAYIN_PLATFORM_CONFIG.privateKey);

  // 调用支付平台接口
  const response = await fetch(PAYIN_PLATFORM_CONFIG.apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestParams),
  });

  if (!response.ok) {
    throw new Error(`支付平台接口返回错误: ${response.status}`);
  }

  const responseData: UnifiedOrderResponse = await response.json();

  // 检查响应状态
  if (responseData.code !== 0) {
    throw new Error(`支付平台返回错误: ${responseData.msg || '未知错误'}`);
  }

  // 解析返回数据
  let data: any;
  if (typeof responseData.data === 'string') {
    data = JSON.parse(responseData.data);
  } else {
    data = responseData.data;
  }

  // 验证签名（如果返回了签名）
  if (responseData.sign && data) {
    const isValid = verifySignature({ ...data, sign: responseData.sign }, PAYIN_PLATFORM_CONFIG.privateKey);
    if (!isValid) {
      throw new Error('支付平台返回的签名验证失败');
    }
  }

  return data;
}

/**
 * 验证签名（从 signature.ts 导入）
 */
function verifySignature(params: any, key: string): boolean {
  const { generateSignature } = require('@/lib/payin-signature');
  const sign = params.sign;
  if (!sign) return false;
  const calculatedSign = generateSignature(params, key);
  return calculatedSign.toLowerCase() === sign.toLowerCase();
}
