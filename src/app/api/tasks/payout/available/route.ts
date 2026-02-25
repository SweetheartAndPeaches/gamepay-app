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
    const minAmount = parseFloat(searchParams.get('minAmount') || '0');
    const maxAmountStr = searchParams.get('maxAmount');
    const maxAmount = maxAmountStr ? parseFloat(maxAmountStr) : Infinity;

    console.log('[API Available Tasks] Params:', {
      offset,
      limit,
      minAmount,
      maxAmount,
      maxAmountStr,
    });

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

    // 获取可领取的任务列表（支持分页和金额范围筛选）
    const filter: Record<string, any> = {
      type: 'payout',
      status: 'pending',
    };

    // 添加金额范围筛选（数据库层面）
    // 使用 and=() 语法进行范围查询
    if (minAmount > 0 && maxAmount !== Infinity) {
      // 同时有最小和最大金额限制，使用 and=() 语法
      filter.amount = `and=(amount.gte.${minAmount},amount.lte.${maxAmount})`;
    } else if (minAmount > 0) {
      // 只有最小金额限制
      filter.amount = `gte.${minAmount}`;
    }
    // maxAmount === Infinity 时不添加限制

    console.log('[API Available Tasks] Query filter:', filter);

    const tasks = await supabaseQuery(
      'orders',
      {
        filter,
        limit: limit + 1, // 多查一条用于判断是否有更多数据
        offset: offset,
        order: {
          column: 'created_at',
          ascending: false,
        },
      }
    );

    // 判断是否还有更多数据（基于原始查询结果）
    const hasMore = tasks.length > limit;
    const validTasks = hasMore ? tasks.slice(0, limit) : tasks;

    console.log('[API Available Tasks] Before filter:', {
      tasksCount: validTasks.length,
      amounts: validTasks.map((t: any) => t.amount),
      maxAmount,
    });

    // 过滤掉已过期的任务（金额范围已在数据库层面筛选）
    const filteredTasks = validTasks.filter((task: any) => {
      const isNotExpired = new Date(task.expires_at) > new Date();
      return isNotExpired;
    });

    console.log('[API Available Tasks] After filter:', {
      tasksCount: filteredTasks.length,
      amounts: filteredTasks.map((t: any) => t.amount),
    });

    console.log('[API Available Tasks] After filter:', {
      tasksCount: filteredTasks.length,
      amounts: filteredTasks.map((t: any) => t.amount),
    });

    // 如果过滤后的任务数为 0，且还有更多数据，需要继续查询下一页
    // 否则直接返回结果
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
