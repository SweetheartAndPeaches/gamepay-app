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

    // 获取用户代收设置
    const { data: userSettings, error: userSettingsError } = await client
      .from('user_settings')
      .select('*')
      .eq('user_id', payload.userId)
      .eq('setting_type', 'payin')
      .maybeSingle();

    if (userSettingsError) {
      console.error('Get user settings error:', userSettingsError);
      return NextResponse.json(
        { success: false, message: '获取用户设置失败' },
        { status: 500 }
      );
    }

    // 检查用户是否启用了代收
    if (!userSettings || !userSettings.enabled) {
      return NextResponse.json({
        success: true,
        message: '代收功能未开启',
        data: {
          enabled: true,
          userEnabled: false,
          tasks: [],
        },
      });
    }

    // 获取用户余额
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

    // 获取用户已分配的代收任务
    const { data: tasks, error: tasksError } = await client
      .from('orders')
      .select('*, bank_accounts!inner(*)')
      .eq('user_id', payload.userId)
      .eq('type', 'payin')
      .in('status', ['claimed', 'completed'])
      .order('created_at', { ascending: false })
      .limit(50);

    if (tasksError) {
      console.error('Get tasks error:', tasksError);
      return NextResponse.json(
        { success: false, message: '获取任务列表失败' },
        { status: 500 }
      );
    }

    // 获取用户代收账户
    const { data: accounts, error: accountsError } = await client
      .from('bank_accounts')
      .select('*')
      .eq('user_id', payload.userId)
      .eq('status', 'active');

    if (accountsError) {
      console.error('Get accounts error:', accountsError);
      return NextResponse.json(
        { success: false, message: '获取代收账户失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '获取任务列表成功',
      data: {
        enabled: true,
        userEnabled: true,
        userBalance,
        userSettings,
        tasks: tasks || [],
        accounts: accounts || [],
      },
    });
  } catch (error) {
    console.error('Get assigned tasks error:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}
