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

    const client = getSupabaseClient(token);

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
      .from('bank_accounts')
      .select('*')
      .eq('user_id', payload.userId)
      .eq('status', 'active');

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
        message: '请先设置代收账户',
        data: {
          enabled: true,
          hasAccounts: false,
          tasks: [],
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

    // 检查用户是否有未完成的代收任务
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
      return NextResponse.json({
        success: true,
        message: '当前有未完成的代收任务',
        data: {
          enabled: true,
          hasAccounts: true,
          userBalance,
          activeTask,
          tasks: [],
        },
      });
    }

    // 获取可接收的代收任务列表（金额不超过用户余额）
    const { data: tasks, error: tasksError } = await client
      .from('orders')
      .select('*')
      .eq('type', 'payin')
      .eq('status', 'pending')
      .lte('amount', userBalance)
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
