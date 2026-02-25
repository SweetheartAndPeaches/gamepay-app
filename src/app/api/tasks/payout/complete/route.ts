import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { supabaseQueryOne, supabaseUpdate, supabaseInsert } from '@/storage/database/supabase-rest';

interface CompleteRequest {
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

    const body: CompleteRequest = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: '订单 ID 不能为空' },
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

    // 检查是否已上传支付凭证
    if (!order.payment_screenshot_url) {
      return NextResponse.json(
        { success: false, message: '请先上传支付凭证' },
        { status: 400 }
      );
    }

    // 标记任务为完成
    const now = new Date();
    await supabaseUpdate(
      'orders',
      {
        status: 'completed',
        task_completed_at: now.toISOString(),
        updated_at: now.toISOString(),
      },
      {
        id: orderId,
      }
    );

    // 计算奖励
    const reward = parseFloat(order.commission.toString());

    // 获取用户当前余额
    const user = await supabaseQueryOne(
      'users',
      {
        select: 'balance',
        filter: {
          id: payload.userId,
        },
      }
    );

    if (!user) {
      return NextResponse.json(
        { success: false, message: '获取用户信息失败' },
        { status: 500 }
      );
    }

    const newBalance = parseFloat(user.balance.toString()) + reward;

    // 更新用户余额
    await supabaseUpdate(
      'users',
      {
        balance: newBalance,
        updated_at: now.toISOString(),
      },
      {
        id: payload.userId,
      }
    );

    // 记录余额变动
    await supabaseInsert('balance_records', {
      user_id: payload.userId,
      type: 'task_reward',
      amount: reward,
      balance_after: newBalance,
      description: `完成代付任务奖励（订单号：${order.order_no}）`,
      related_order_id: order.id,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    });

    // 获取更新后的订单
    const updatedOrder = await supabaseQueryOne(
      'orders',
      {
        filter: {
          id: orderId,
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: '任务完成，奖励已发放',
      data: {
        order: updatedOrder,
        reward,
        newBalance,
      },
    });
  } catch (error) {
    console.error('Complete task error:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}
