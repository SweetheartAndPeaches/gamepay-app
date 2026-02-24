import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyToken } from '@/lib/jwt';

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

    const client = getSupabaseClient(token);

    // 检查用户是否已有未完成的任务
    const { data: activeTask, error: activeTaskError } = await client
      .from('tasks')
      .select('*')
      .eq('claimed_by', payload.userId)
      .eq('task_type', 'payout')
      .eq('status', 'claimed')
      .maybeSingle();

    if (activeTaskError) {
      console.error('Get active task error:', activeTaskError);
      return NextResponse.json(
        { success: false, message: '获取任务状态失败' },
        { status: 500 }
      );
    }

    if (activeTask) {
      return NextResponse.json(
        { success: false, message: '您当前有未完成的任务，请先完成后再领取新任务' },
        { status: 400 }
      );
    }

    // 检查订单是否可领取
    const { data: order, error: orderError } = await client
      .from('tasks')
      .select('*')
      .eq('id', orderId)
      .eq('task_type', 'payout')
      .eq('status', 'pending')
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { success: false, message: '任务不存在或已被领取' },
        { status: 404 }
      );
    }

    // 检查任务是否已过期
    if (new Date(order.expired_at) < new Date()) {
      return NextResponse.json(
        { success: false, message: '任务已过期' },
        { status: 400 }
      );
    }

    // 领取任务
    const { data: updatedOrder, error: updateError } = await client
      .from('tasks')
      .update({
        claimed_by: payload.userId,
        status: 'claimed',
        claimed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .select()
      .single();

    if (updateError) {
      console.error('Claim task error:', updateError);
      return NextResponse.json(
        { success: false, message: '领取任务失败，请重试' },
        { status: 500 }
      );
    }

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
