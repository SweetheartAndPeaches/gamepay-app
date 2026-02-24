import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { hashPassword, generateInviteCode } from '@/lib/crypto';
import { generateToken } from '@/lib/jwt';
import type { RegisterRequest } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: RegisterRequest = await request.json();
    const { phone, password, inviteCode } = body;

    // 验证必填字段
    if (!phone || !password) {
      return NextResponse.json(
        { success: false, message: '手机号和密码不能为空' },
        { status: 400 }
      );
    }

    // 验证手机号格式
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      return NextResponse.json(
        { success: false, message: '手机号格式不正确' },
        { status: 400 }
      );
    }

    // 验证密码长度
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: '密码长度不能少于6位' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();

    // 检查手机号是否已存在
    const { data: existingUser } = await client
      .from('users')
      .select('id')
      .eq('phone', phone)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: '该手机号已注册' },
        { status: 409 }
      );
    }

    // 验证邀请码（如果提供）
    let inviterId = null;
    if (inviteCode) {
      const { data: inviter } = await client
        .from('users')
        .select('id')
        .eq('invite_code', inviteCode)
        .single();

      if (inviter) {
        inviterId = inviter.id;
      }
    }

    // 生成用户邀请码
    const userInviteCode = generateInviteCode();

    // 加密密码
    const passwordHash = await hashPassword(password);

    // 创建用户
    const { data: newUser, error: createError } = await client
      .from('users')
      .insert({
        phone,
        password_hash: passwordHash,
        invite_code: userInviteCode,
        inviter_id: inviterId,
        balance: '0.00',
        frozen_balance: '0.00',
        status: 'active',
      })
      .select()
      .single();

    if (createError) {
      console.error('Create user error:', createError);
      return NextResponse.json(
        { success: false, message: '注册失败，请重试' },
        { status: 500 }
      );
    }

    // 如果有邀请人，创建代理关系（如果邀请人是代理）
    if (inviterId) {
      const { data: agent } = await client
        .from('agent_relationships')
        .select('*')
        .eq('agent_id', inviterId)
        .single();

      if (agent) {
        await client.from('agent_relationships').insert({
          agent_id: newUser.id,
          referrer_id: inviterId,
          commission_rate: agent.commission_rate,
          level: agent.level + 1,
          total_referrals: 0,
          status: 'active',
        });

        // 更新邀请人的推荐人数
        await client
          .from('agent_relationships')
          .update({ total_referrals: agent.total_referrals + 1 })
          .eq('agent_id', inviterId);
      }
    }

    // 生成 JWT Token
    const token = generateToken({
      userId: newUser.id,
      phone: newUser.phone,
      inviteCode: newUser.invite_code,
    });

    return NextResponse.json({
      success: true,
      message: '注册成功',
      data: {
        token,
        user: {
          id: newUser.id,
          phone: newUser.phone,
          inviteCode: newUser.invite_code,
        },
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}
