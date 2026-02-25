import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { supabaseQuery } from '@/storage/database/supabase-rest';

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

    // 获取用户已领取的任务
    const tasks = await supabaseQuery(
      'orders',
      {
        filter: {
          user_id: payload.userId,
          type: 'payout',
          status: 'in.(claimed,completed)',
        },
        limit: 50,
        order: {
          column: 'created_at',
          ascending: false,
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: '获取已领取任务成功',
      data: tasks,
    });
  } catch (error) {
    console.error('Get claimed tasks error:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}
