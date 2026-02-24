import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyToken } from '@/lib/jwt';

interface ClaimRequest {
  orderId: string;
  accountId: string;
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

    const body: ClaimRequest = await request.json();
    const { orderId, accountId } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: '订单 ID 不能为空' },
        { status: 400 }
      );
    }

    if (!accountId) {
      return NextResponse.json(
        { success: false, message: '代收账户 ID 不能为空' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient(token);

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

    // 检查用户是否已有未完成的任务
    const { data: activeTask, error: activeTaskError } = await client
      .from('orders')
      .select('*')
      .eq('user_id', payload.userId)
      .eq('type', 'payin')
      .eq('status', 'claimed')
      .maybeSingle();

    if (activeTaskError) {
      console.error('Get active task error:', activeTaskError);
      return NextResponse.json(
        { success: false, message: '获取任务状态失败' },
        { status: 500 }
      );
    }

    if (activeTask) {
      return NextResponse.json(
        { success: false, message: '您当前有未完成的任务，请先完成后再领取新任务' },
        { status: 400 }
      );
    }

    // 检查订单是否可领取
    const { data: order, error: orderError } = await client
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('type', 'payin')
      .eq('status', 'pending')
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { success: false, message: '任务不存在或已被领取' },
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
    const frozenBalance = parseFloat((user as any).frozen_balance?.toString() || '0');
    if (userBalance < order.amount) {
      return NextResponse.json(
        { success: false, message: `余额不足，需要 ${order.amount} 元` },
        { status: 400 }
      );
    }

    // 检查代收账户是否属于当前用户
    const { data: account, error: accountError } = await client
      .from('bank_accounts')
      .select('*')
      .eq('id', accountId)
      .eq('user_id', payload.userId)
      .eq('status', 'active')
      .single();

    if (accountError || !account) {
      return NextResponse.json(
        { success: false, message: '代收账户不存在或已被禁用' },
        { status: 404 }
      );
    }

    // 扣减用户余额（冻结）
    const newBalance = userBalance - order.amount;
    const newFrozenBalance = frozenBalance + order.amount;

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
      amount: order.amount,
      balance_after: newBalance,
      description: `代收任务冻结（订单号：${order.order_no}）`,
      related_order_id: order.id,
    });

    // 领取任务
    const { data: updatedOrder, error: updateError } = await client
      .from('orders')
      .update({
        user_id: payload.userId,
        status: 'claimed',
        payment_account: accountId,
        payment_method: account.type,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .select()
      .single();

    if (updateError) {
      console.error('Claim task error:', updateError);
      return NextResponse.json(
        { success: false, message: '领取任务失败，请重试' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '领取任务成功，已冻结余额',
      data: {
        order: updatedOrder,
        newBalance,
        frozenAmount: order.amount,
      },
    });
  } catch (error) {
    console.error('Claim task error:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}
