import { NextResponse } from 'next/server';
import { query } from '@/storage/database/postgres-client';

export async function GET() {
  try {
    // 测试数据库连接
    const result = await query(`
      SELECT
        COUNT(*) as total_orders,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
        SUM(CASE WHEN status = 'claimed' THEN 1 ELSE 0 END) as claimed_orders
      FROM orders
      WHERE type = 'payout'
    `);

    const tasks = await query(`
      SELECT
        id,
        order_no,
        amount,
        commission,
        payment_method,
        status,
        expires_at,
        NOW() as current_time
      FROM orders
      WHERE type = 'payout'
        AND status = 'pending'
        AND expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 5
    `);

    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      data: {
        stats: result[0],
        tasks,
      },
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: 'Database connection failed',
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}
