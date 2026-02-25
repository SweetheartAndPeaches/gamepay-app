import { NextResponse } from 'next/server';
import { supabaseQuery, supabaseQueryOne, supabaseUpdate } from '@/storage/database/supabase-rest';

export async function GET() {
  try {
    console.log('开始领取功能测试...');

    // 1. 获取一个真实存在的用户
    const users = await supabaseQuery('users', {
      limit: 1,
    });

    if (users.length === 0) {
      return NextResponse.json({
        success: false,
        message: '领取功能测试失败',
        error: '数据库中没有用户，无法进行测试',
      });
    }

    const realUserId = users[0].id;
    console.log('找到真实用户:', realUserId);

    // 2. 获取待领取的任务
    const tasks = await supabaseQuery('orders', {
      filter: {
        type: 'payout',
        status: 'pending',
      },
      limit: 3,
    });

    if (tasks.length === 0) {
      return NextResponse.json({
        success: false,
        message: '没有可领取的任务',
      });
    }

    const task = tasks[0];
    console.log('找到待领取任务:', task.id);

    // 3. 检查任务状态
    const orderBefore = await supabaseQueryOne('orders', {
      filter: { id: task.id },
    });

    // 4. 更新任务状态
    const updatedOrders = await supabaseUpdate(
      'orders',
      {
        user_id: realUserId,
        status: 'claimed',
        updated_at: new Date().toISOString(),
      },
      { id: task.id }
    );

    // 5. 验证更新结果
    const orderAfter = await supabaseQueryOne('orders', {
      filter: { id: task.id },
    });

    console.log('任务领取成功！');

    return NextResponse.json({
      success: true,
      message: '领取功能测试成功',
      data: {
        taskId: task.id,
        taskOrderNo: task.order_no,
        statusBefore: orderBefore?.status,
        statusAfter: orderAfter?.status,
        userId: orderAfter?.user_id,
        updateSuccess: updatedOrders.length > 0,
      },
    });
  } catch (error: any) {
    console.error('领取功能测试失败:', error);
    return NextResponse.json({
      success: false,
      message: '领取功能测试失败',
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}
