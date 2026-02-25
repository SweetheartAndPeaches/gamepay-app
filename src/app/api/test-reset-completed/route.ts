import { NextResponse } from 'next/server';
import { supabaseQuery, supabaseUpdate } from '@/storage/database/supabase-rest';

export async function GET() {
  try {
    console.log('重置所有 completed 任务（不限制用户）...');

    // 获取所有 completed 任务
    const completedTasks = await supabaseQuery('orders', {
      filter: {
        type: 'payout',
        status: 'completed',
      },
    });

    if (completedTasks.length === 0) {
      return NextResponse.json({
        success: false,
        message: '没有 completed 任务',
      });
    }

    const task = completedTasks[0];
    console.log('找到 completed 任务:', task.id, task.order_no, 'user_id:', task.user_id);

    // 重置任务状态
    const updatedOrders = await supabaseUpdate(
      'orders',
      {
        status: 'claimed',
        payment_screenshot_url: null,
        task_completed_at: null,
        updated_at: new Date().toISOString(),
      },
      {
        id: task.id,
      }
    );

    console.log('任务重置成功');

    return NextResponse.json({
      success: true,
      message: '任务重置成功',
      data: {
        taskId: task.id,
        orderNo: task.order_no,
        userId: task.user_id,
        updatedOrder: updatedOrders[0],
      },
    });
  } catch (error: any) {
    console.error('重置失败:', error);
    return NextResponse.json({
      success: false,
      message: '重置失败',
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}
