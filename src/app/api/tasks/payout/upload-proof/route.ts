import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { supabaseQueryOne, supabaseUpdate } from '@/storage/database/supabase-rest';

interface UploadProofRequest {
  orderId: string;
  screenshotUrl: string;
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

    const body: UploadProofRequest = await request.json();
    const { orderId, screenshotUrl } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: '订单 ID 不能为空' },
        { status: 400 }
      );
    }

    if (!screenshotUrl) {
      return NextResponse.json(
        { success: false, message: '支付凭证不能为空' },
        { status: 400 }
      );
    }

    // 检查订单是否属于当前用户
    const order = await supabaseQueryOne(
      'orders',
      {
        filter: {
          id: orderId,
          user_id: payload.userId,
          type: 'payout',
          status: 'claimed',
        },
      }
    );

    if (!order) {
      return NextResponse.json(
        { success: false, message: '订单不存在或状态不正确' },
        { status: 404 }
      );
    }

    // 检查任务是否已过期
    if (new Date(order.expires_at) < new Date()) {
      return NextResponse.json(
        { success: false, message: '任务已过期，无法上传支付凭证' },
        { status: 400 }
      );
    }

    // 更新支付凭证
    const updatedOrder = await supabaseUpdate(
      'orders',
      {
        payment_screenshot_url: screenshotUrl,
        updated_at: new Date().toISOString(),
      },
      {
        id: orderId,
      }
    );

    if (updatedOrder.length === 0) {
      return NextResponse.json(
        { success: false, message: '上传支付凭证失败，请重试' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '上传支付凭证成功，等待审核',
      data: updatedOrder[0],
    });
  } catch (error) {
    console.error('Upload proof error:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}
