import { NextRequest, NextResponse } from 'next/server';
import { supabaseQuery } from '@/storage/database/supabase-rest';

export async function GET() {
  try {
    // 使用 REST API 直接查询
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/orders?select=*&type=eq.payout&order=created_at.desc&limit=1000`,
      {
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY || '',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY || ''}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const tasks = await response.json();

    const stats = tasks.reduce((acc: any, task: any) => {
      acc.total = (acc.total || 0) + 1;
      acc.byStatus[task.status] = (acc.byStatus[task.status] || 0) + 1;
      acc.byPaymentMethod[task.payment_method] = (acc.byPaymentMethod[task.payment_method] || 0) + 1;

      const amount = parseFloat(task.amount);
      acc.totalAmount = (acc.totalAmount || 0) + amount;
      acc.totalCommission = (acc.totalCommission || 0) + parseFloat(task.commission || 0);

      if (task.status === 'pending') {
        acc.pendingAmount = (acc.pendingAmount || 0) + amount;
      }

      return acc;
    }, {
      total: 0,
      byStatus: {},
      byPaymentMethod: {},
      totalAmount: 0,
      totalCommission: 0,
      pendingAmount: 0,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...stats,
        recentTasks: tasks.slice(0, 10).map((task: any) => ({
          orderNo: task.order_no,
          amount: task.amount,
          commission: task.commission,
          status: task.status,
          paymentMethod: task.payment_method,
          createdAt: task.created_at,
        })),
      },
    });
  } catch (error: any) {
    console.error('Get payout stats error:', error);
    return NextResponse.json(
      {
        success: false,
        message: '获取统计数据失败',
        error: error.message,
        details: error.stack,
      },
      { status: 500 }
    );
  }
}
