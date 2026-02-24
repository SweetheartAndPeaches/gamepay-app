import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyToken } from '@/lib/jwt';

interface ConfirmRequest {
  taskId: string;
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
    const { taskId } = body;

    if (!taskId) {
      return NextResponse.json(
        { success: false, message: '任务 ID 不能为空' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient(token);

    // 检查任务是否属于当前用户
    const { data: task, error: taskError } = await client
      .from('payin_task_allocations')
      .select('*')
      .eq('id', taskId)
      .eq('user_id', payload.userId)
      .eq('status', 'claimed')
      .single();

    if (taskError || !task) {
      return NextResponse.json(
        { success: false, message: '任务不存在或状态不正确' },
        { status: 404 }
      );
    }

    // 检查是否已上传转账凭证
    if (!task.transfer_proof_url) {
      return NextResponse.json(
        { success: false, message: '请先上传转账凭证' },
        { status: 400 }
      );
    }

    // 检查任务是否已过期
    if (new Date(task.expires_at) < new Date()) {
      return NextResponse.json(
        { success: false, message: '任务已过期' },
        { status: 400 }
      );
    }

    const now = new Date();
    const taskAmount = parseFloat(task.amount.toString());
    const commission = parseFloat(task.commission.toString());

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
    // 可用余额不变（因为已经冻结了）
    // 解冻冻结金额
    // 增加佣金奖励
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
      description: `代收任务解冻（订单号：${task.order_no}）`,
      related_order_id: task.id,
    });

    // 记录佣金奖励
    await client.from('balance_records').insert({
      user_id: payload.userId,
      type: 'task_reward',
      amount: commission,
      balance_after: newBalance,
      description: `完成代收任务奖励（订单号：${task.order_no}）`,
      related_order_id: task.id,
    });

    // 标记任务为完成
    const { data: updatedTask, error: updateError } = await client
      .from('payin_task_allocations')
      .update({
        status: 'completed',
        completed_at: now.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq('id', taskId)
      .select()
      .single();

    if (updateError) {
      console.error('Complete task error:', updateError);
      return NextResponse.json(
        { success: false, message: '标记任务完成失败，请重试' },
        { status: 500 }
      );
    }

    // 更新账户统计信息
    if (updatedTask.account_id) {
      // 获取账户信息
      const { data: account, error: accountError } = await client
        .from('payment_accounts')
        .select('payin_allocated_amount, payin_earned_commission, payin_total_count')
        .eq('id', updatedTask.account_id)
        .single();

      if (!accountError && account) {
        const { error: updateAccountError } = await client
          .from('payment_accounts')
          .update({
            payin_allocated_amount: (account.payin_allocated_amount || 0) - taskAmount,
            payin_earned_commission: (account.payin_earned_commission || 0) + commission,
            payin_total_count: (account.payin_total_count || 0) + 1,
            updated_at: now.toISOString(),
          })
          .eq('id', updatedTask.account_id);

        if (updateAccountError) {
          console.error('Update account error:', updateAccountError);
          // 不影响主流程，只记录错误
          console.error('Failed to update account payin stats');
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: '代收完成，奖励已发放',
      data: {
        task: updatedTask,
        taskAmount,
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
