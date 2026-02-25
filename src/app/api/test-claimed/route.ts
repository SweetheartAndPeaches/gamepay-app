import { NextResponse } from 'next/server';
import { supabaseQuery } from '@/storage/database/supabase-rest';

export async function GET() {
  try {
    console.log('测试已领取任务 API...');

    // 获取用户 ID
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

    // 查询该用户已领取的任务
    const claimedOrders = await supabaseQuery('orders', {
      filter: {
        user_id: userId,
        type: 'payout',
        status: 'in.(claimed,completed)',
      },
    });

    console.log('已领取任务数:', claimedOrders.length);

    // 同时查询所有状态为 claimed 的订单
    const allClaimedOrders = await supabaseQuery('orders', {
      filter: {
        type: 'payout',
        status: 'claimed',
      },
    });

    console.log('所有 claimed 状态订单数:', allClaimedOrders.length);

    return NextResponse.json({
      success: true,
      data: {
        userId,
        claimedOrdersCount: claimedOrders.length,
        claimedOrders,
        allClaimedOrdersCount: allClaimedOrders.length,
        allClaimedOrders: allClaimedOrders.map((o: any) => ({
          id: o.id,
          orderNo: o.order_no,
          userId: o.user_id,
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
