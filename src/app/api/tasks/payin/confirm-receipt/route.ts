import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyToken } from '@/lib/jwt';

/**
 * 确认收款API
 * 用户检查账户收到款项后，上传支付凭证并确认收款
 */
interface ConfirmReceiptRequest {
  /** 订单ID */
  orderId: string;
  /** 支付凭证URL（已通过 upload-proof API 上传） */
  transferProofUrl: string;
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

    const body: ConfirmReceiptRequest = await request.json();
    const { orderId, transferProofUrl } = body;

    // 验证参数
    if (!orderId) {
      return NextResponse.json(
        { success: false, message: '订单 ID 不能为空' },
        { status: 400 }
      );
    }

    if (!transferProofUrl) {
      return NextResponse.json(
        { success: false, message: '请先上传支付凭证' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();

    // 检查订单是否属于当前用户
    const { data: order, error: orderError } = await client
      .from('payin_orders')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', payload.userId)
      .in('status', ['created', 'paying'])
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { success: false, message: '订单不存在或状态不正确' },
        { status: 404 }
      );
    }

    // 检查订单是否已过期
    if (new Date(order.expires_at) < new Date()) {
      return NextResponse.json(
        { success: false, message: '订单已过期' },
        { status: 400 }
      );
    }

    const now = new Date();
    const taskAmount = parseFloat(order.amount.toString());
    const commission = parseFloat(order.commission.toString());

    // 获取用户当前余额
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
      .eq('id', payload.userId);

    if (updateBalanceError) {
      console.error('Update balance error:', updateBalanceError);
      return NextResponse.json(
        { success: false, message: '更新余额失败' },
        { status: 500 }
      );
    }

    // 记录余额变动（解冻）
    await client.from('balance_records').insert({
      user_id: payload.userId,
      type: 'unfreeze',
      amount: taskAmount,
      balance_after: userBalance + taskAmount,
      description: `代收订单确认收款，解冻余额（订单号：${order.order_no}）`,
      related_order_id: order.order_no,
    });

    // 记录佣金奖励
    await client.from('balance_records').insert({
      user_id: payload.userId,
      type: 'task_reward',
      amount: commission,
      balance_after: newBalance,
      description: `完成代收订单奖励（订单号：${order.order_no}）`,
      related_order_id: order.order_no,
    });

    // 更新订单状态
    const { data: updatedOrder, error: updateOrderError } = await client
      .from('payin_orders')
      .update({
        status: 'success',
        transfer_proof_url: transferProofUrl,
        updated_at: now.toISOString(),
      })
      .eq('id', orderId)
      .select()
      .single();

    if (updateOrderError) {
      console.error('Update order error:', updateOrderError);
      return NextResponse.json(
        { success: false, message: '更新订单状态失败' },
        { status: 500 }
      );
    }

    // 更新账户统计信息
    if (order.account_id) {
      // 获取账户信息
      const { data: account, error: accountError } = await client
        .from('payment_accounts')
        .select('payin_earned_commission, payin_total_count')
        .eq('id', order.account_id)
        .single();

      if (!accountError && account) {
        const { error: updateAccountError } = await client
          .from('payment_accounts')
          .update({
            payin_earned_commission: (account.payin_earned_commission || 0) + commission,
            payin_total_count: (account.payin_total_count || 0) + 1,
            updated_at: now.toISOString(),
          })
          .eq('id', order.account_id);

        if (updateAccountError) {
          console.error('Update account error:', updateAccountError);
          // 不影响主流程，只记录错误
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: '确认收款成功，奖励已发放',
      data: {
        order: updatedOrder,
        taskAmount,
        commission,
        newBalance,
      },
    });
  } catch (error) {
    console.error('Confirm receipt error:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}
