import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyToken } from '@/lib/jwt';

interface ClaimRequest {
  taskId: string;
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
    const { taskId, accountId } = body;

    if (!taskId) {
      return NextResponse.json(
        { success: false, message: '任务 ID 不能为空' },
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
      .from('payin_task_allocations')
      .select('*')
      .eq('user_id', payload.userId)
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

    // 检查任务是否可领取
    const { data: task, error: taskError } = await client
      .from('payin_task_allocations')
      .select('*')
      .eq('id', taskId)
      .eq('user_id', payload.userId)
      .eq('status', 'pending')
      .single();

    if (taskError || !task) {
      return NextResponse.json(
        { success: false, message: '任务不存在或已被领取' },
        { status: 404 }
      );
    }

    // 检查任务是否已过期
    if (new Date(task.expires_at) < new Date()) {
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
    if (userBalance < task.amount) {
      return NextResponse.json(
        { success: false, message: `余额不足，需要 ${task.amount} 元` },
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
    const newBalance = userBalance - task.amount;
    const newFrozenBalance = frozenBalance + task.amount;

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
      amount: task.amount,
      balance_after: newBalance,
      description: `代收任务冻结（订单号：${task.order_no}）`,
      related_order_id: task.id,
    });

    // 领取任务
    const { data: updatedTask, error: updateError } = await client
      .from('payin_task_allocations')
      .update({
        status: 'claimed',
        claimed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId)
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
        task: updatedTask,
        newBalance,
        frozenAmount: task.amount,
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
