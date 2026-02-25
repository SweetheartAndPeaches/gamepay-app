import { NextResponse } from 'next/server';
import { supabaseQuery } from '@/storage/database/supabase-rest';

export async function GET() {
  try {
    // 测试数据库连接
    console.log('[test-rest] Starting query...');
    const tasks = await supabaseQuery('orders', {
      filter: {
        type: 'payout',
        status: 'pending',
      },
      limit: 5,
    });
    console.log('[test-rest] Query result:', tasks);

    return NextResponse.json({
      success: true,
      message: 'REST API connection successful',
      data: {
        count: tasks.length,
        tasks,
      },
    });
  } catch (error: any) {
    console.error('[test-rest] Error:', error);
    return NextResponse.json({
      success: false,
      message: 'REST API connection failed',
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}
