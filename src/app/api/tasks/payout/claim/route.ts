import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { query, queryOne, execute } from '@/storage/database/postgres-client';

interface ClaimRequest {
  orderId: string;
}

export async function POST(request: NextRequest) {
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

    const body: ClaimRequest = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: '订单 ID 不能为空' },
        { status: 400 }
      );
    }

    // 检查用户是否已有未完成的任务
    const activeTask = await queryOne(
      `SELECT * FROM orders
       WHERE user_id = $1
         AND type = 'payout'
         AND status = 'claimed'`,
      [payload.userId]
    );

    if (activeTask) {
      return NextResponse.json(
        { success: false, message: '您当前有未完成的任务，请先完成后再领取新任务' },
        { status: 400 }
      );
    }

    // 检查订单是否可领取
    const order = await queryOne(
      `SELECT * FROM orders
       WHERE id = $1
         AND type = 'payout'
         AND status = 'pending'`,
      [orderId]
    );

    if (!order) {
      return NextResponse.json(
        { success: false, message: '任务不存在或已被领取' },
        { status: 404 }
      );
    }

    // 检查任务是否已过期
    if (new Date(order.expires_at) < new Date()) {
      return NextResponse.json(
        { success: false, message: '任务已过期' },
        { status: 400 }
      );
    }

    // 领取任务
    const rowCount = await execute(
      `UPDATE orders
       SET user_id = $1,
           status = 'claimed',
           updated_at = NOW()
       WHERE id = $2`,
      [payload.userId, orderId]
    );

    if (rowCount === 0) {
      return NextResponse.json(
        { success: false, message: '领取任务失败，请重试' },
        { status: 500 }
      );
    }

    // 获取更新后的订单
    const updatedOrder = await queryOne(
      `SELECT * FROM orders WHERE id = $1`,
      [orderId]
    );

    return NextResponse.json({
      success: true,
      message: '领取任务成功',
      data: updatedOrder,
    });
  } catch (error) {
    console.error('Claim task error:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}
