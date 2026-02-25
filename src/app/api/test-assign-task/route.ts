import { NextResponse } from 'next/server';
import { supabaseQuery, supabaseUpdate } from '@/storage/database/supabase-rest';

export async function GET() {
  try {
    console.log('将任务分配给当前用户...');

    // 获取用户
    const users = await supabaseQuery('users', {
      limit: 1,
    });

    if (users.length === 0) {
      return NextResponse.json({
        success: false,
        message: '没有用户',
      });
    }

    const userId = users[0].id;
    console.log('用户 ID:', userId);

    // 获取所有 claimed 任务
    const claimedTasks = await supabaseQuery('orders', {
      filter: {
        type: 'payout',
        status: 'claimed',
      },
    });

    if (claimedTasks.length === 0) {
      return NextResponse.json({
        success: false,
        message: '没有 claimed 任务',
      });
    }

    const task = claimedTasks[0];
    console.log('任务当前 user_id:', task.user_id);

    // 更新任务的 user_id
    const updated = await supabaseUpdate(
      'orders',
      {
        user_id: userId,
        updated_at: new Date().toISOString(),
      },
      {
        id: task.id,
      }
    );

    console.log('任务已分配给用户:', userId);

    return NextResponse.json({
      success: true,
      message: '任务分配成功',
      data: {
        taskId: task.id,
        orderNo: task.order_no,
        oldUserId: task.user_id,
        newUserId: userId,
        updatedOrder: updated[0],
      },
    });
  } catch (error: any) {
    console.error('分配失败:', error);
    return NextResponse.json({
      success: false,
      message: '分配失败',
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}
