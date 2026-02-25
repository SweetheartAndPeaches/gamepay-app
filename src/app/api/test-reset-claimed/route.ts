import { NextResponse } from 'next/server';
import { supabaseUpdate } from '@/storage/database/supabase-rest';

export async function GET() {
  try {
    console.log('重置任务状态...');

    // 重置任务状态为 claimed，移除支付凭证
    const updatedOrders = await supabaseUpdate(
      'orders',
      {
        status: 'claimed',
        payment_screenshot_url: null,
        task_completed_at: null,
        updated_at: new Date().toISOString(),
      },
      {
        id: 'd06a81e4-ebdb-477c-9f4c-2cddd1e90adc',
      }
    );

    console.log('任务重置成功:', updatedOrders.length);

    return NextResponse.json({
      success: true,
      message: '任务重置成功',
      data: updatedOrders[0] || updatedOrders,
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
