import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyToken, extractTokenFromHeader } from '@/lib/jwt';

export async function GET(request: NextRequest) {
  try {
    // 获取并验证 Token
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

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

    // 查询用户信息
    const { data: user, error: userError } = await client
      .from('users')
      .select('*')
      .eq('id', payload.userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, message: '用户不存在' },
        { status: 404 }
      );
    }

    // 查询用户今日任务完成情况
    const today = new Date().toISOString().split('T')[0];
    const { data: todayStats, error: statsError } = await client
      .from('daily_task_stats')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today);

    // 整理统计数据
    const dailyStats = todayStats?.reduce((acc: any, stat: any) => {
      acc[stat.amount_range] = stat.completed_count;
      return acc;
    }, {}) || {};

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          phone: user.phone,
          balance: user.balance,
          frozenBalance: user.frozen_balance,
          inviteCode: user.invite_code,
          googleAuthEnabled: user.google_auth_enabled,
          status: user.status,
        },
        dailyStats,
      },
    });
  } catch (error) {
    console.error('Get user info error:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}
