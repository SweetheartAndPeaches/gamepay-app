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

    // 获取用户已领取的任务
    const { data: tasks, error: tasksError } = await client
      .from('orders')
      .select('*')
      .eq('user_id', payload.userId)
      .eq('type', 'payout')
      .in('status', ['claimed', 'completed'])
      .order('created_at', { ascending: false })
      .limit(50);

    if (tasksError) {
      console.error('Get claimed tasks error:', tasksError);
      return NextResponse.json(
        { success: false, message: '获取已领取任务失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '获取已领取任务成功',
      data: tasks || [],
    });
  } catch (error) {
    console.error('Get claimed tasks error:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}
