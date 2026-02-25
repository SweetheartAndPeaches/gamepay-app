import { NextRequest, NextResponse } from 'next/server';
import { supabaseQuery } from '@/storage/database/supabase-rest';

export async function DELETE() {
  try {
    // 使用 REST API 直接删除所有测试订单
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/orders?order_no=like.ORD%25`,
      {
        method: 'DELETE',
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

    return NextResponse.json({
      success: true,
      message: '测试数据已删除',
    });
  } catch (error: any) {
    console.error('Delete test data error:', error);
    return NextResponse.json(
      {
        success: false,
        message: '删除测试数据失败',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
