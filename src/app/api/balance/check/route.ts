import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { supabaseQuery } from '@/storage/database/supabase-rest';

export async function GET(request: NextRequest) {
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

    // 获取用户信息
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
    const currentBalance = parseFloat(user.balance?.toString() || '0');
    const frozenBalance = parseFloat(user.frozen_balance?.toString() || '0');

    // 获取余额记录统计
    const records = await supabaseQuery('balance_records', {
      filter: {
        user_id: payload.userId,
      },
      order: {
        column: 'created_at',
        ascending: false,
      },
      limit: 1,
    });

    const latestRecordBalance = records.length > 0 ? parseFloat(records[0].balance_after?.toString() || '0') : 0;

    // 计算应该有的余额
    let calculatedBalance = 0;
    const allRecords = await supabaseQuery('balance_records', {
      filter: {
        user_id: payload.userId,
      },
      order: {
        column: 'created_at',
        ascending: true,
      },
    });

    for (const record of allRecords) {
      const amount = parseFloat(record.amount?.toString() || '0');
      calculatedBalance += amount;
    }

    const difference = calculatedBalance - currentBalance;
    const isConsistent = Math.abs(difference) < 0.01;

    return NextResponse.json({
      success: true,
      data: {
        currentBalance,
        calculatedBalance,
        frozenBalance,
        latestRecordBalance,
        difference,
        isConsistent,
        recordsCount: allRecords.length,
        recommendation: isConsistent
          ? '余额数据一致，无需同步'
          : `余额不一致，建议同步。差额：${difference.toFixed(2)} 元`,
      },
    });
  } catch (error) {
    console.error('Check balance error:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}
