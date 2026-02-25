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

    // 获取用户的所有余额记录
    const records = await supabaseQuery('balance_records', {
      filter: {
        user_id: payload.userId,
      },
      order: {
        column: 'created_at',
        ascending: false,
      },
    });

    // 计算统计数据
    let totalIncome = 0;
    let totalOutcome = 0;

    for (const record of records) {
      const amount = parseFloat(record.amount.toString());
      // income: task_reward, deposit, unffreeze
      // outcome: withdrawal, freeze
      if (record.type === 'task_reward' || record.type === 'deposit' || record.type === 'unfreeze') {
        totalIncome += amount;
      } else if (record.type === 'withdrawal' || record.type === 'freeze') {
        totalOutcome += Math.abs(amount);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        totalIncome,
        totalOutcome,
        recordsCount: records.length,
      },
    });
  } catch (error) {
    console.error('Get balance statistics error:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}
