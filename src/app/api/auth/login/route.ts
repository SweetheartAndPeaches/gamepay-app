import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyPassword } from '@/lib/crypto';
import { generateToken } from '@/lib/jwt';
import type { LoginRequest } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();
    const { phone, password, googleCode } = body;

    // 验证必填字段
    if (!phone || !password) {
      return NextResponse.json(
        { success: false, message: '手机号和密码不能为空' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();

    // 查询用户
    const { data: user, error: userError } = await client
      .from('users')
      .select('*')
      .eq('phone', phone)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, message: '手机号或密码错误' },
        { status: 401 }
      );
    }

    // 检查账号状态
    if (user.status !== 'active') {
      return NextResponse.json(
        { success: false, message: '账号已被禁用，请联系客服' },
        { status: 403 }
      );
    }

    // 验证密码
    const isPasswordValid = await verifyPassword(
      password,
      user.password_hash
    );

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: '手机号或密码错误' },
        { status: 401 }
      );
    }

    // 验证谷歌验证码（如果已启用）
    if (user.google_auth_enabled) {
      if (!googleCode) {
        return NextResponse.json(
          { success: false, message: '请输入谷歌验证码' },
          { status: 400 }
        );
      }

      // TODO: 验证谷歌验证码
      // const isGoogleCodeValid = await verifyGoogleCode(user.google_auth_secret, googleCode);
      // if (!isGoogleCodeValid) {
      //   return NextResponse.json(
      //     { success: false, message: '谷歌验证码错误' },
      //     { status: 401 }
      //   );
      // }
    }

    // 生成 JWT Token
    const token = generateToken({
      userId: user.id,
      phone: user.phone,
      inviteCode: user.invite_code,
    });

    return NextResponse.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          phone: user.phone,
          inviteCode: user.invite_code,
          googleAuthEnabled: user.google_auth_enabled,
          balance: user.balance,
          frozenBalance: user.frozen_balance,
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}
