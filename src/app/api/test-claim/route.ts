import { NextResponse } from 'next/server';
import { supabaseQuery, supabaseUpdate } from '@/storage/database/supabase-rest';

export async function GET() {
  try {
    console.log('开始完整领取流程测试...');

    // 1. 获取一个真实存在的用户
    const users = await supabaseQuery('users', {
      limit: 1,
    });

    if (users.length === 0) {
      return NextResponse.json({
        success: false,
        message: '数据库中没有用户',
      });
    }

    const realUserId = users[0].id;
    console.log('步骤1: 找到真实用户:', realUserId);

    // 2. 查找待领取的任务
    const pendingOrders = await supabaseQuery('orders', {
      filter: {
        type: 'payout',
        status: 'pending',
      },
      limit: 1,
    });

    if (pendingOrders.length === 0) {
      return NextResponse.json({
        success: false,
        message: '没有待领取的任务',
      });
    }

    const order = pendingOrders[0];
    console.log('步骤2: 找到待领取任务:', order.id, order.order_no);

    // 3. 检查用户是否已有未完成的任务
    const activeTask = await supabaseQuery('orders', {
      filter: {
        user_id: realUserId,
        type: 'payout',
        status: 'claimed',
      },
    });

    if (activeTask.length > 0) {
      console.log('用户已有未完成任务:', activeTask[0].id);

      // 直接返回当前已领取的任务，用于测试 claimed API
      return NextResponse.json({
        success: true,
        message: '用户已有未完成任务，测试已领取 API',
        data: {
          step: 'already_have_task',
          orderId: activeTask[0].id,
          orderNo: activeTask[0].order_no,
          userId: realUserId,
        },
      });
    }

    // 4. 领取任务
    console.log('步骤3: 开始领取任务...');
    const updatedOrders = await supabaseUpdate(
      'orders',
      {
        user_id: realUserId,
        status: 'claimed',
        updated_at: new Date().toISOString(),
      },
      {
        id: order.id,
      }
    );

    if (updatedOrders.length === 0) {
      return NextResponse.json({
        success: false,
        message: '领取任务失败',
      });
    }

    console.log('步骤4: 任务领取成功！');

    // 5. 验证领取结果 - 查询该用户已领取的任务
    const claimedOrders = await supabaseQuery('orders', {
      filter: {
        user_id: realUserId,
        type: 'payout',
        status: 'in.(claimed,completed)',
      },
    });

    console.log('步骤5: 验证结果 - 用户已领取任务数:', claimedOrders.length);

    return NextResponse.json({
      success: true,
      message: '完整领取流程测试成功',
      data: {
        userId: realUserId,
        orderId: order.id,
        orderNo: order.order_no,
        statusAfter: updatedOrders[0].status,
        claimedOrdersCount: claimedOrders.length,
        claimedOrders: claimedOrders.map((o: any) => ({
          id: o.id,
          orderNo: o.order_no,
          status: o.status,
        })),
      },
    });
  } catch (error: any) {
    console.error('测试失败:', error);
    return NextResponse.json({
      success: false,
      message: '测试失败',
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}
