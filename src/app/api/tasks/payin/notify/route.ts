import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifySignature } from '@/lib/payin-signature';
import { PAYIN_PLATFORM_CONFIG, PayinNotifyRequest, OrderState } from '@/lib/payin-config';

/**
 * 支付平台回调通知API
 * 支付平台通过此接口通知订单支付状态
 *
 * 注意：
 * 1. 必须返回字符串 "success"（小写，前后不能有空格和换行符）
 * 2. 如果返回非 success，支付平台会再次通知
 * 3. 通知频率为 0/30/60/90/120/150 秒
 */
export async function POST(request: NextRequest) {
  try {
    // 获取支付平台传递的参数（表单格式）
    const formData = await request.formData();
    const params: PayinNotifyRequest = {
      payOrderId: formData.get('payOrderId') as string,
      mchNo: formData.get('mchNo') as string,
      appId: formData.get('appId') as string,
      mchOrderNo: formData.get('mchOrderNo') as string,
      amount: parseInt(formData.get('amount') as string, 10),
      state: parseInt(formData.get('state') as string, 10),
      sign: formData.get('sign') as string,
    };

    // 验证必要参数
    if (!params.payOrderId || !params.mchOrderNo || !params.amount || params.state === undefined || !params.sign) {
      console.error('Missing required parameters:', params);
      return new NextResponse('fail', { status: 400 });
    }

    // 验证商户号和应用ID
    if (params.mchNo !== PAYIN_PLATFORM_CONFIG.mchNo || params.appId !== PAYIN_PLATFORM_CONFIG.appId) {
      console.error('Invalid mchNo or appId:', params);
      return new NextResponse('fail', { status: 400 });
    }

    // 验证签名
    const isValid = verifySignature(params, PAYIN_PLATFORM_CONFIG.privateKey);
    if (!isValid) {
      console.error('Invalid signature:', params);
      return new NextResponse('fail', { status: 400 });
    }

    const client = getSupabaseClient();

    // 查找对应的本地订单
    const { data: order, error: orderError } = await client
      .from('payin_orders')
      .select('*')
      .eq('order_no', params.mchOrderNo)
      .single();

    if (orderError || !order) {
      console.error('Order not found:', params.mchOrderNo);
      return new NextResponse('fail', { status: 404 });
    }

    // 检查订单状态，如果已经是最终状态，则不再处理
    if (['success', 'failed', 'closed'].includes(order.status)) {
      console.log('Order already in final state:', order.status);
      return new NextResponse('success');
    }

    // 检查订单金额是否匹配
    const orderAmountInCents = Math.round(parseFloat(order.amount.toString()) * 100);
    if (orderAmountInCents !== params.amount) {
      console.error('Amount mismatch:', { orderAmount: orderAmountInCents, notifyAmount: params.amount });
      return new NextResponse('fail', { status: 400 });
    }

    // 根据支付平台返回的订单状态更新本地订单
    if (params.state === OrderState.SUCCESS) {
      // 支付成功
      await handleOrderSuccess(client, order);
    } else if (params.state === OrderState.FAILED || params.state === OrderState.CLOSED) {
      // 支付失败或订单关闭
      await handleOrderFailed(client, order);
    } else {
      // 其他状态（支付中等），只更新订单状态
      await client
        .from('payin_orders')
        .update({
          status: 'paying',
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);
    }

    // 返回 success（必须是小写，前后不能有空格和换行符）
    return new NextResponse('success');
  } catch (error) {
    console.error('Notify callback error:', error);
    return new NextResponse('fail', { status: 500 });
  }
}

/**
 * 处理订单支付成功
 */
async function handleOrderSuccess(client: any, order: any) {
  const now = new Date();
  const taskAmount = parseFloat(order.amount.toString());
  const commission = parseFloat(order.commission.toString());

  // 获取用户当前余额
  const { data: user, error: userError } = await client
    .from('users')
    .select('balance, frozen_balance')
    .eq('id', order.user_id)
    .single();

  if (userError || !user) {
    console.error('Get user error:', userError);
    throw new Error('获取用户信息失败');
  }

  const userBalance = parseFloat(user.balance.toString());
  const frozenBalance = parseFloat((user as any).frozen_balance?.toString() || '0');

  // 计算新余额：
  // 可用余额 = 原余额 + 订单金额 + 佣金
  // 冻结余额 = 原冻结余额 - 订单金额
  const newFrozenBalance = frozenBalance - taskAmount;
  const newBalance = userBalance + taskAmount + commission;

  // 更新用户余额
  const { error: updateBalanceError } = await client
    .from('users')
    .update({
      balance: newBalance,
      frozen_balance: newFrozenBalance,
      updated_at: now.toISOString(),
    })
    .eq('id', order.user_id);

  if (updateBalanceError) {
    console.error('Update balance error:', updateBalanceError);
    throw new Error('更新余额失败');
  }

  // 记录余额变动（解冻）
  await client.from('balance_records').insert({
    user_id: order.user_id,
    type: 'unfreeze',
    amount: taskAmount,
    balance_after: userBalance + taskAmount,
    description: `代收订单支付成功，解冻余额（订单号：${order.order_no}）`,
    related_order_id: order.order_no,
  });

  // 记录佣金奖励
  await client.from('balance_records').insert({
    user_id: order.user_id,
    type: 'task_reward',
    amount: commission,
    balance_after: newBalance,
    description: `完成代收订单奖励（订单号：${order.order_no}）`,
    related_order_id: order.order_no,
  });

  // 更新订单状态
  await client
    .from('payin_orders')
    .update({
      status: 'success',
      updated_at: now.toISOString(),
    })
    .eq('id', order.id);
}

/**
 * 处理订单支付失败
 */
async function handleOrderFailed(client: any, order: any) {
  const taskAmount = parseFloat(order.amount.toString());

  // 获取用户当前余额
  const { data: user, error: userError } = await client
    .from('users')
    .select('balance, frozen_balance')
    .eq('id', order.user_id)
    .single();

  if (userError || !user) {
    console.error('Get user error:', userError);
    throw new Error('获取用户信息失败');
  }

  const userBalance = parseFloat(user.balance.toString());
  const frozenBalance = parseFloat((user as any).frozen_balance?.toString() || '0');

  // 计算新余额：
  // 可用余额 = 原余额 + 订单金额
  // 冻结余额 = 原冻结余额 - 订单金额
  const newFrozenBalance = frozenBalance - taskAmount;
  const newBalance = userBalance + taskAmount;

  // 更新用户余额
  const { error: updateBalanceError } = await client
    .from('users')
    .update({
      balance: newBalance,
      frozen_balance: newFrozenBalance,
      updated_at: new Date().toISOString(),
    })
    .eq('id', order.user_id);

  if (updateBalanceError) {
    console.error('Update balance error:', updateBalanceError);
    throw new Error('更新余额失败');
  }

  // 记录余额变动（解冻）
  await client.from('balance_records').insert({
    user_id: order.user_id,
    type: 'unfreeze',
    amount: taskAmount,
    balance_after: newBalance,
    description: `代收订单支付失败，解冻余额（订单号：${order.order_no}）`,
    related_order_id: order.order_no,
  });

  // 更新订单状态
  await client
    .from('payin_orders')
    .update({
      status: 'failed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', order.id);
}
