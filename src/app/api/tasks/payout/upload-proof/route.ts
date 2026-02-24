import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyToken } from '@/lib/jwt';

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

    const client = getSupabaseClient(token);

    // 检查订单是否属于当前用户
    const { data: order, error: orderError } = await client
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', payload.userId)
      .eq('type', 'payout')
      .eq('status', 'claimed')
      .single();

    if (orderError || !order) {
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
    const { data: updatedOrder, error: updateError } = await client
      .from('orders')
      .update({
        payment_screenshot_url: screenshotUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .select()
      .single();

    if (updateError) {
      console.error('Upload proof error:', updateError);
      return NextResponse.json(
        { success: false, message: '上传支付凭证失败，请重试' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '上传支付凭证成功，等待审核',
      data: updatedOrder,
    });
  } catch (error) {
    console.error('Upload proof error:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}
