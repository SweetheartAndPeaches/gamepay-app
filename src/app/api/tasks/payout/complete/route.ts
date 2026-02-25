import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { getPostgresClient } from '@/storage/database/postgres-client';

interface CompleteRequest {
  orderId: string;
}

export async function POST(request: NextRequest) {
  const client = await getPostgresClient();

  try {
    // 验证用户身份
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json(
        { success: false, message: '未授权访问' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, message: 'Token 无效或已过期' },
        { status: 401 }
      );
    }

    const body: CompleteRequest = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: '订单 ID 不能为空' },
        { status: 400 }
      );
    }

    // 开始事务
    await client.query('BEGIN');

    // 检查订单是否属于当前用户
    const orderResult = await client.query(
      `SELECT * FROM orders
       WHERE id = $1
         AND user_id = $2
         AND type = 'payout'
         AND status = 'claimed'`,
      [orderId, payload.userId]
    );

    const order = orderResult.rows[0];

    if (!order) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { success: false, message: '订单不存在或状态不正确' },
        { status: 404 }
      );
    }

    // 检查是否已上传支付凭证
    if (!order.payment_screenshot_url) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { success: false, message: '请先上传支付凭证' },
        { status: 400 }
      );
    }

    // 标记任务为完成
    await client.query(
      `UPDATE orders
       SET status = 'completed',
           task_completed_at = NOW(),
           updated_at = NOW()
       WHERE id = $1`,
      [orderId]
    );

    // 计算奖励
    const reward = parseFloat(order.commission.toString());

    // 获取用户当前余额
    const userResult = await client.query(
      `SELECT balance FROM users WHERE id = $1`,
      [payload.userId]
    );

    const user = userResult.rows[0];

    if (!user) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { success: false, message: '获取用户信息失败' },
        { status: 500 }
      );
    }

    const newBalance = parseFloat(user.balance.toString()) + reward;

    // 更新用户余额
    await client.query(
      `UPDATE users
       SET balance = $1,
           updated_at = NOW()
       WHERE id = $2`,
      [newBalance, payload.userId]
    );

    // 记录余额变动
    await client.query(
      `INSERT INTO balance_records (user_id, type, amount, balance_after, description, related_order_id, created_at, updated_at)
       VALUES ($1, 'task_reward', $2, $3, $4, $5, NOW(), NOW())`,
      [payload.userId, reward, newBalance, `完成代付任务奖励（订单号：${order.order_no}）`, order.id]
    );

    // 提交事务
    await client.query('COMMIT');

    // 获取更新后的订单
    const updatedOrderResult = await client.query(
      `SELECT * FROM orders WHERE id = $1`,
      [orderId]
    );

    const updatedOrder = updatedOrderResult.rows[0];

    return NextResponse.json({
      success: true,
      message: '任务完成，奖励已发放',
      data: {
        order: updatedOrder,
        reward,
        newBalance,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Complete task error:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
