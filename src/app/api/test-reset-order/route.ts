import { NextResponse } from 'next/server';
import { supabaseUpdate } from '@/storage/database/supabase-rest';

export async function GET() {
  try {
    console.log('重置订单状态为 pending...');

    // 重置之前的订单状态
    const updatedOrders = await supabaseUpdate(
      'orders',
      {
        user_id: null,
        status: 'pending',
        updated_at: new Date().toISOString(),
      },
      {
        id: 'af6eb585-647a-49d9-bf50-2cddd1e90adc',
      }
    );

    console.log('订单重置成功:', updatedOrders.length);

    return NextResponse.json({
      success: true,
      message: '订单重置成功',
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
