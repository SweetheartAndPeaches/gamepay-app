import { NextResponse } from 'next/server';
import { supabaseQuery, supabaseQueryOne, supabaseUpdate } from '@/storage/database/supabase-rest';

export async function GET() {
  try {
    // 1. 测试查询
    const tasks = await supabaseQuery('orders', {
      filter: {
        type: 'payout',
        status: 'pending',
      },
      limit: 1,
    });

    if (tasks.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No tasks found',
      });
    }

    const task = tasks[0];

    // 2. 测试更新
    const updated = await supabaseUpdate(
      'orders',
      {
        updated_at: new Date().toISOString(),
      },
      {
        id: task.id,
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Update test successful',
      data: {
        originalTask: task,
        updatedCount: updated.length,
        updatedTask: updated[0],
      },
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: 'Update test failed',
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}
