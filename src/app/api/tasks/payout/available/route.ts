import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { supabaseQuery, supabaseQueryOne } from '@/storage/database/supabase-rest';

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

    // 获取分页参数
    const searchParams = request.nextUrl.searchParams;
    const offset = parseInt(searchParams.get('offset') || '0');
    const limit = parseInt(searchParams.get('limit') || '10');

    // 获取用户当前是否有未完成的任务
    const activeTask = await supabaseQueryOne(
      'orders',
      {
        filter: {
          user_id: payload.userId,
          type: 'payout',
          status: 'claimed',
        },
      }
    );

    // 如果用户有未完成的任务，不允许领取新任务
    if (activeTask) {
      return NextResponse.json({
        success: true,
        message: '当前有未完成的任务',
        data: {
          canClaim: false,
          activeTask,
          tasks: [],
          hasMore: false,
        },
      });
    }

    // 获取可领取的任务列表（支持分页）
    const tasks = await supabaseQuery(
      'orders',
      {
        filter: {
          type: 'payout',
          status: 'pending',
        },
        limit: limit + 1, // 多查一条用于判断是否有更多数据
        offset: offset,
        order: {
          column: 'created_at',
          ascending: false,
        },
      }
    );

    // 判断是否还有更多数据
    const hasMore = tasks.length > limit;
    const validTasks = hasMore ? tasks.slice(0, limit) : tasks;

    // 过滤掉已过期的任务
    const filteredTasks = validTasks.filter((task: any) => {
      return new Date(task.expires_at) > new Date();
    });

    return NextResponse.json({
      success: true,
      message: '获取任务列表成功',
      data: {
        canClaim: true,
        tasks: filteredTasks,
        hasMore: hasMore,
        offset: offset,
        limit: limit,
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
