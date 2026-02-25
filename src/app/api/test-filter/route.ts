import { NextResponse } from 'next/server';
import { supabaseQuery } from '@/storage/database/supabase-rest';

export async function GET() {
  try {
    console.log('测试 filter 语法...');

    const userId = '87eb070e-cea7-4229-8a7c-1013d06a862d';

    // 测试 1: 使用 in.() 语法
    console.log('测试 1: status=in.(claimed,completed)');
    const result1 = await supabaseQuery('orders', {
      filter: {
        user_id: userId,
        type: 'payout',
        status: 'in.(claimed,completed)',
      },
    });
    console.log('结果 1:', result1.length);

    // 测试 2: 直接传递数组
    console.log('测试 2: status=["claimed","completed"]');
    const result2 = await supabaseQuery('orders', {
      filter: {
        user_id: userId,
        type: 'payout',
        status: ['claimed', 'completed'],
      },
    });
    console.log('结果 2:', result2.length);

    // 测试 3: 只查询 claimed
    console.log('测试 3: status=claimed');
    const result3 = await supabaseQuery('orders', {
      filter: {
        user_id: userId,
        type: 'payout',
        status: 'claimed',
      },
    });
    console.log('结果 3:', result3.length);

    return NextResponse.json({
      success: true,
      data: {
        test1_count: result1.length,
        test2_count: result2.length,
        test3_count: result3.length,
        test1_orders: result1.map((o: any) => ({ id: o.id, orderNo: o.order_no, status: o.status })),
        test2_orders: result2.map((o: any) => ({ id: o.id, orderNo: o.order_no, status: o.status })),
        test3_orders: result3.map((o: any) => ({ id: o.id, orderNo: o.order_no, status: o.status })),
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
