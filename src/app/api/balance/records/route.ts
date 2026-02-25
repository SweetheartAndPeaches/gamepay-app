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

    // 获取分页参数
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const type = searchParams.get('type');

    // 构建查询条件
    const filter: Record<string, any> = {
      user_id: payload.userId,
    };

    if (type) {
      filter.type = type;
    }

    // 获取余额记录
    const records = await supabaseQuery('balance_records', {
      filter,
      limit,
      order: {
        column: 'created_at',
        ascending: false,
      },
    });

    return NextResponse.json({
      success: true,
      data: records.map((record: any) => ({
        id: record.id,
        userId: record.user_id,
        type: record.type,
        amount: parseFloat(record.amount),
        balanceAfter: parseFloat(record.balance_after),
        description: record.description,
        relatedOrderId: record.related_order_id,
        createdAt: record.created_at,
        updatedAt: record.updated_at,
      })),
    });
  } catch (error) {
    console.error('Get balance records error:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}
