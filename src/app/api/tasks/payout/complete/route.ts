import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyToken } from '@/lib/jwt';

interface CompleteRequest {
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

    const body: CompleteRequest = await request.json();
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
      .eq('type', 'payout')
      .eq('status', 'claimed')
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { success: false, message: '订单不存在或状态不正确' },
        { status: 404 }
      );
    }

    // 检查是否已上传支付凭证
    if (!order.payment_screenshot_url) {
      return NextResponse.json(
        { success: false, message: '请先上传支付凭证' },
        { status: 400 }
      );
    }

    // 标记任务为完成
    const now = new Date();
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

    // 计算奖励并更新用户余额
    const reward = parseFloat(order.commission.toString());

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

    const newBalance = parseFloat(user.balance.toString()) + reward;

    // 更新用户余额
    const { error: updateBalanceError } = await client
      .from('users')
      .update({
        balance: newBalance,
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

    // 记录余额变动
    await client.from('balance_records').insert({
      user_id: payload.userId,
      type: 'task_reward',
      amount: reward,
      balance_after: newBalance,
      description: `完成代付任务奖励（订单号：${order.order_no}）`,
      related_order_id: order.id,
    });

    return NextResponse.json({
      success: true,
      message: '任务完成，奖励已发放',
      data: {
        order: updatedOrder,
        reward,
        newBalance,
      },
    });
  } catch (error) {
    console.error('Complete task error:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}
