import { NextResponse } from 'next/server';
import { generateToken } from '@/lib/jwt';

export async function GET() {
  try {
    // 获取用户
    const { supabaseQuery } = await import('@/storage/database/supabase-rest');
    const users = await supabaseQuery('users', {
      limit: 1,
    });

    if (users.length === 0) {
      return NextResponse.json({
        success: false,
        message: '没有用户',
      });
    }

    const user = users[0];
    const token = generateToken({
      userId: user.id,
      phone: user.phone,
      inviteCode: user.invite_code || '',
    });

    return NextResponse.json({
      success: true,
      data: {
        token,
        userId: user.id,
        phone: user.phone,
      },
    });
  } catch (error: any) {
    console.error('生成 token 失败:', error);
    return NextResponse.json({
      success: false,
      message: '生成 token 失败',
      error: error.message,
    }, { status: 500 });
  }
}
