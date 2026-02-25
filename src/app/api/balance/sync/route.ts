import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { supabaseQuery, supabaseUpdate } from '@/storage/database/supabase-rest';

export async function POST(request: NextRequest) {
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

    // 获取用户的所有余额记录
    const records = await supabaseQuery('balance_records', {
      filter: {
        user_id: payload.userId,
      },
      order: {
        column: 'created_at',
        ascending: true, // 按时间顺序，从头开始计算
      },
    });

    console.log('[Sync Balance] User:', payload.userId);
    console.log('[Sync Balance] Records count:', records.length);

    // 按时间顺序重新计算余额
    let calculatedBalance = 0;
    const detailedCalculation: any[] = [];

    for (const record of records) {
      const amount = parseFloat(record.amount.toString());
      const previousBalance = calculatedBalance;
      calculatedBalance += amount;

      detailedCalculation.push({
        id: record.id,
        type: record.type,
        amount: amount,
        description: record.description,
        previousBalance: previousBalance,
        calculatedBalance: calculatedBalance,
        recordedBalance: record.balance_after,
        match: Math.abs(calculatedBalance - record.balance_after) < 0.01,
      });
    }

    // 获取用户当前余额
    const users = await supabaseQuery('users', {
      filter: {
        id: payload.userId,
      },
    });

    if (users.length === 0) {
      return NextResponse.json(
        { success: false, message: '用户不存在' },
        { status: 404 }
      );
    }

    const user = users[0];
    const currentBalance = parseFloat(user.balance.toString());
    const frozenBalance = parseFloat(user.frozen_balance?.toString() || '0');

    console.log('[Sync Balance] Current user balance:', currentBalance);
    console.log('[Sync Balance] Calculated balance:', calculatedBalance);
    console.log('[Sync Balance] Difference:', calculatedBalance - currentBalance);

    // 更新用户余额
    await supabaseUpdate(
      'users',
      {
        balance: calculatedBalance,
        updated_at: new Date().toISOString(),
      },
      {
        id: payload.userId,
      }
    );

    return NextResponse.json({
      success: true,
      message: '余额同步成功',
      data: {
        currentBalance,
        calculatedBalance,
        frozenBalance,
        difference: calculatedBalance - currentBalance,
        recordsCount: records.length,
        detailedCalculation: detailedCalculation.slice(-10), // 只返回最后 10 条记录
      },
    });
  } catch (error) {
    console.error('Sync balance error:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}
