import { NextResponse } from 'next/server';
import { supabaseQuery } from '@/storage/database/supabase-rest';

export async function GET() {
  try {
    console.log('开始检查订单状态...');

    // 获取一个真实存在的用户
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
    console.log('找到用户:', realUserId);

    // 查询所有代付订单
    const allOrders = await supabaseQuery('orders', {
      filter: {
        type: 'payout',
      },
    });

    console.log('总订单数:', allOrders.length);

    // 按状态分组
    const statusCount = allOrders.reduce((acc: Record<string, number>, order: any) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});

    console.log('订单状态分布:', statusCount);

    // 查询该用户已领取的任务
    const claimedOrders = await supabaseQuery('orders', {
      filter: {
        user_id: realUserId,
        type: 'payout',
        status: 'in.(claimed,completed)',
      },
    });

    console.log('用户已领取任务数:', claimedOrders.length);

    return NextResponse.json({
      success: true,
      data: {
        totalOrders: allOrders.length,
        statusCount,
        claimedOrders: claimedOrders.map((order: any) => ({
          id: order.id,
          orderNo: order.order_no,
          status: order.status,
          userId: order.user_id,
        })),
        userId: realUserId,
      },
    });
  } catch (error: any) {
    console.error('检查失败:', error);
    return NextResponse.json({
      success: false,
      message: '检查失败',
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}
