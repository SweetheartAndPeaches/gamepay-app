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

    // 获取用户当前是否有未完成的任务
    const { data: activeTask, error: activeTaskError } = await client
      .from('orders')
      .select('*')
      .eq('user_id', payload.userId)
      .eq('type', 'payout')
      .eq('status', 'claimed')
      .maybeSingle();

    if (activeTaskError) {
      console.error('Get active task error:', activeTaskError);
      return NextResponse.json(
        { success: false, message: '获取任务失败' },
        { status: 500 }
      );
    }

    // 如果用户有未完成的任务，不允许领取新任务
    if (activeTask) {
      return NextResponse.json({
        success: true,
        message: '当前有未完成的任务',
        data: {
          canClaim: false,
          activeTask,
          tasks: [],
        },
      });
    }

    // 获取可领取的任务列表
    const { data: tasks, error: tasksError } = await client
      .from('orders')
      .select('*')
      .eq('type', 'payout')
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
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
        canClaim: true,
        tasks: tasks || [],
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
