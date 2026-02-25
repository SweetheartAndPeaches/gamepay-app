import { NextResponse } from 'next/server';
import { supabaseQuery, supabaseInsert } from '@/storage/database/supabase-rest';

export async function GET() {
  try {
    console.log('开始创建测试订单...');

    // 1. 获取一个真实存在的用户
    const users = await supabaseQuery('users', {
      limit: 1,
    });

    if (users.length === 0) {
      return NextResponse.json({
        success: false,
        message: '数据库中没有用户',
      });
    }

    const user = users[0];
    console.log('找到用户:', user.id);

    // 2. 创建一个测试订单
    const newOrder = await supabaseInsert('orders', {
      order_no: `TEST${Date.now()}`,
      type: 'payout',
      status: 'pending',
      amount: 100.00,
      commission: 5.00,
      payment_method: 'wechat',
      payment_account: 'test123456',
      expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30分钟后过期
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    console.log('创建订单成功:', newOrder.id);

    return NextResponse.json({
      success: true,
      message: '创建测试订单成功',
      data: newOrder,
    });
  } catch (error: any) {
    console.error('创建订单失败:', error);
    return NextResponse.json({
      success: false,
      message: '创建订单失败',
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}
