import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyToken } from '@/lib/jwt';

export async function GET(request: NextRequest) {
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

    const client = getSupabaseClient();

    // 检查代收任务是否开启
    const { data: setting, error: settingError } = await client
      .from('system_settings')
      .select('value')
      .eq('key', 'payin.enabled')
      .single();

    if (settingError || !setting || setting.value !== 'true') {
      return NextResponse.json({
        success: true,
        message: '代收任务暂未开启',
        data: {
          enabled: false,
          reason: '系统维护中',
          tasks: [],
        },
      });
    }

    // 检查用户是否设置了代收账户
    const { data: payinAccounts, error: accountsError } = await client
      .from('payment_accounts')
      .select('*')
      .eq('user_id', payload.userId)
      .eq('is_active', true)
      .eq('payin_enabled', true)
      .in('account_type', ['wechat_qrcode', 'alipay_qrcode', 'alipay_account', 'bank_card']);

    if (accountsError) {
      console.error('Get payin accounts error:', accountsError);
      return NextResponse.json(
        { success: false, message: '获取代收账户失败' },
        { status: 500 }
      );
    }

    if (!payinAccounts || payinAccounts.length === 0) {
      return NextResponse.json({
        success: true,
        message: '请先设置代收账户并启用代收功能',
        data: {
          enabled: true,
          hasAccounts: false,
          tasks: [],
          accounts: [],
        },
      });
    }

    // 获取用户余额
    const { data: user, error: userError } = await client
      .from('users')
      .select('balance')
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

    // 检查用户是否有未完成的代收任务（从 payin_task_allocations 表）
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
      return NextResponse.json({
        success: true,
        message: '当前有未完成的代收任务',
        data: {
          enabled: true,
          hasAccounts: true,
          userBalance,
          activeTask,
          tasks: [],
          accounts: payinAccounts,
        },
      });
    }

    // 计算用户可用于代收的总金额
    // 如果所有账户的 payin_max_amount 都是 0，则使用用户全部余额
    // 否则，使用所有账户的剩余金额之和
    let availableAmount = 0;
    const hasLimitedAccounts = payinAccounts.some(
      (acc: any) => acc.payin_max_amount && acc.payin_max_amount > 0
    );

    if (hasLimitedAccounts) {
      // 计算所有账户的剩余金额之和
      availableAmount = payinAccounts.reduce((sum: number, acc: any) => {
        const maxAmount = acc.payin_max_amount || 0;
        const allocatedAmount = acc.payin_allocated_amount || 0;
        return sum + (maxAmount - allocatedAmount);
      }, 0);
    } else {
      // 无限制，使用用户全部余额
      availableAmount = userBalance;
    }

    // 获取分配给该用户的代收任务列表（从 payin_task_allocations 表）
    // 金额不超过可用金额
    const { data: tasks, error: tasksError } = await client
      .from('payin_task_allocations')
      .select('*')
      .eq('user_id', payload.userId)
      .eq('status', 'pending')
      .lte('amount', availableAmount)
      .gt('expires_at', new Date().toISOString())
      .order('amount', { ascending: true })
      .limit(20);

    if (tasksError) {
      console.error('Get available tasks error:', tasksError);
      return NextResponse.json(
        { success: false, message: '获取任务列表失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '获取任务列表成功',
      data: {
        enabled: true,
        hasAccounts: true,
        userBalance,
        availableAmount,
        tasks: tasks || [],
        accounts: payinAccounts,
      },
    });
  } catch (error) {
    console.error('Get available tasks error:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}
