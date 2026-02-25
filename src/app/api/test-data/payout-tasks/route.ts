import { NextRequest, NextResponse } from 'next/server';
import { supabaseInsert } from '@/storage/database/supabase-rest';

export async function POST(request: NextRequest) {
  try {
    const { count = 500 } = await request.json();

    const paymentMethods = ['wechat', 'alipay', 'bank', 'paypal', 'venmo', 'cash_app', 'zelle', 'stripe', 'wise', 'payoneer', 'swift'];

    const statuses = ['pending', 'claimed', 'completed', 'expired', 'cancelled'];
    const statusWeights = [0.5, 0.2, 0.2, 0.08, 0.02]; // 权重分布

    const tasks = [];

    for (let i = 0; i < count; i++) {
      const now = new Date();
      const amount = Math.floor(Math.random() * 9900) + 100; // 100-10000 元
      const commission = parseFloat((amount * (0.005 + Math.random() * 0.015)).toFixed(2)); // 0.5%-2% 佣金

      // 随机选择状态
      const status = weightedRandom(statuses, statusWeights);

      let expiresAt: Date;
      let createdAt: Date;

      if (status === 'expired') {
        // 已过期的任务，过期时间在过去
        createdAt = new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000 * 7); // 7天内创建
        expiresAt = new Date(createdAt.getTime() + 30 * 60 * 1000); // 30分钟后过期
      } else if (status === 'completed' || status === 'cancelled') {
        // 已完成或取消的任务
        createdAt = new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000 * 30); // 30天内创建
        expiresAt = new Date(createdAt.getTime() + 30 * 60 * 1000);
      } else if (status === 'claimed') {
        // 已领取但未完成的任务
        createdAt = new Date(now.getTime() - Math.random() * 30 * 60 * 1000); // 30分钟内创建
        expiresAt = new Date(createdAt.getTime() + 30 * 60 * 1000);
      } else {
        // 待领取的任务
        createdAt = new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000 * 2); // 2天内创建
        expiresAt = new Date(createdAt.getTime() + 30 * 60 * 1000);
      }

      // 随机选择支付方式
      const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];

      // 生成订单号
      const orderNo = `ORD${Date.now()}${String(i).padStart(4, '0')}`;

      // 生成收款信息
      let paymentAccount = '';
      switch (paymentMethod) {
        case 'wechat':
          paymentAccount = `wx_${Math.random().toString(36).substring(2, 8)}`;
          break;
        case 'alipay':
          paymentAccount = `ali_${Math.random().toString(36).substring(2, 8)}`;
          break;
        case 'bank':
          paymentAccount = `6222${Math.floor(Math.random() * 1000000000000000).toString()}`;
          break;
        case 'paypal':
          paymentAccount = `paypal${Math.floor(Math.random() * 10000)}@email.com`;
          break;
        case 'venmo':
          paymentAccount = `@venmo_user_${Math.floor(Math.random() * 10000)}`;
          break;
        case 'cash_app':
          paymentAccount = `$cashapp_${Math.floor(Math.random() * 10000)}`;
          break;
        case 'zelle':
          paymentAccount = `zelle${Math.floor(Math.random() * 10000)}@email.com`;
          break;
        case 'stripe':
          paymentAccount = `acct_${Math.random().toString(36).substring(2, 18)}`;
          break;
        case 'wise':
          paymentAccount = `wise_${Math.random().toString(36).substring(2, 10)}`;
          break;
        case 'payoneer':
          paymentAccount = `payoneer${Math.floor(Math.random() * 10000)}@email.com`;
          break;
        case 'swift':
          paymentAccount = `SWIFT${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
          break;
      }

      // 用户 ID（测试数据设为 NULL）
      const userId: string | null = null;

      const task = {
        order_no: orderNo,
        type: 'payout',
        amount: amount,
        commission: commission,
        status: status,
        user_id: userId,
        payment_method: paymentMethod,
        payment_account: paymentAccount,
        payment_screenshot_url: status === 'completed' ? `https://example.com/screenshots/${orderNo}.jpg` : null,
        expires_at: expiresAt.toISOString(),
        created_at: createdAt.toISOString(),
        updated_at: now.toISOString(),
      };

      tasks.push(task);
    }

    // 逐条插入数据（避免大批量插入导致的问题）
    let insertedCount = 0;
    const errors = [];

    for (const task of tasks) {
      try {
        await supabaseInsert('orders', task);
        insertedCount++;
      } catch (error: any) {
        errors.push({
          orderNo: task.order_no,
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `成功插入 ${insertedCount} 条代付任务测试数据`,
      data: {
        requestedCount: count,
        insertedCount,
        errors: errors.length,
        statusDistribution: tasks.reduce((acc, task) => {
          acc[task.status] = (acc[task.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        errorDetails: errors.slice(0, 10), // 只返回前10个错误
      },
    });
  } catch (error: any) {
    console.error('Insert payout test data error:', error);
    return NextResponse.json(
      {
        success: false,
        message: '插入测试数据失败',
        error: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}

function weightedRandom(items: string[], weights: number[]): string {
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  let random = Math.random() * totalWeight;

  for (let i = 0; i < items.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return items[i];
    }
  }
  return items[items.length - 1];
}
