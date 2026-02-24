import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyToken } from '@/lib/jwt';

interface ConfirmRequest {
  orderId: string;
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

    const body: ConfirmRequest = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: '订单 ID 不能为空' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient(token);

    // 检查订单是否属于当前用户
    const { data: order, error: orderError } = await client
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', payload.userId)
      .eq('type', 'payin')
      .eq('status', 'claimed')
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { success: false, message: '订单不存在或状态不正确' },
        { status: 404 }
      );
    }

    // 检查任务是否已过期
    if (new Date(order.expires_at) < new Date()) {
      return NextResponse.json(
        { success: false, message: '任务已过期' },
        { status: 400 }
      );
    }

    const now = new Date();
    const orderAmount = parseFloat(order.amount.toString());
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
    const frozenBalance = parseFloat(user.frozen_balance?.toString() || '0');

    // 计算新余额：
    // 可用余额不变（因为已经冻结了）
    // 解冻冻结金额
    // 增加佣金奖励
    const newFrozenBalance = frozenBalance - orderAmount;
    const newBalance = userBalance + orderAmount + commission;

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
      amount: orderAmount,
      balance_after: userBalance + orderAmount,
      description: `代收任务解冻（订单号：${order.order_no}）`,
      related_order_id: order.id,
    });

    // 记录佣金奖励
    await client.from('balance_records').insert({
      user_id: payload.userId,
      type: 'task_reward',
      amount: commission,
      balance_after: newBalance,
      description: `完成代收任务奖励（订单号：${order.order_no}）`,
      related_order_id: order.id,
    });

    // 标记任务为完成
    const { data: updatedOrder, error: updateError } = await client
      .from('orders')
      .update({
        status: 'completed',
        task_completed_at: now.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq('id', orderId)
      .select()
      .single();

    if (updateError) {
      console.error('Complete task error:', updateError);
      return NextResponse.json(
        { success: false, message: '标记任务完成失败，请重试' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '代收完成，奖励已发放',
      data: {
        order: updatedOrder,
        orderAmount,
        commission,
        newBalance,
      },
    });
  } catch (error) {
    console.error('Confirm task error:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}
