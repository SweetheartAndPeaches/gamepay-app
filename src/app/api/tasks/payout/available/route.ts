import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { query, queryOne } from '@/storage/database/postgres-client';

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

    // 获取用户当前是否有未完成的任务
    const activeTask = await queryOne(
      `SELECT * FROM orders
       WHERE user_id = $1
         AND type = 'payout'
         AND status = 'claimed'`,
      [payload.userId]
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
        },
      });
    }

    // 获取可领取的任务列表
    const tasks = await query(
      `SELECT * FROM orders
       WHERE type = 'payout'
         AND status = 'pending'
         AND expires_at > NOW()
       ORDER BY created_at DESC
       LIMIT 20`
    );

    return NextResponse.json({
      success: true,
      message: '获取任务列表成功',
      data: {
        canClaim: true,
        tasks,
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
