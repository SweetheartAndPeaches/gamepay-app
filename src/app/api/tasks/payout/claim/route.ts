import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { supabaseQueryOne, supabaseUpdate } from '@/storage/database/supabase-rest';

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

    if (activeTask) {
      return NextResponse.json(
        { success: false, message: '您当前有未完成的任务，请先完成后再领取新任务' },
        { status: 400 }
      );
    }

    // 检查订单是否可领取
    const order = await supabaseQueryOne(
      'orders',
      {
        filter: {
          id: orderId,
          type: 'payout',
          status: 'pending',
        },
      }
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
    const updatedOrder = await supabaseUpdate(
      'orders',
      {
        user_id: payload.userId,
        status: 'claimed',
        updated_at: new Date().toISOString(),
      },
      {
        id: orderId,
      }
    );

    if (updatedOrder.length === 0) {
      return NextResponse.json(
        { success: false, message: '领取任务失败，请重试' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '领取任务成功',
      data: updatedOrder[0],
    });
  } catch (error) {
    console.error('Claim task error:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}
