import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyToken } from '@/lib/jwt';

interface UpdateSettingsRequest {
  enabled: boolean;
  maxAmount: number;
  dailyLimit: number;
  autoAccept: boolean;
}

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

    const client = getSupabaseClient(token);

    // 获取用户代收设置
    const { data: settings, error: settingsError } = await client
      .from('user_settings')
      .select('*')
      .eq('user_id', payload.userId)
      .eq('setting_type', 'payin')
      .maybeSingle();

    if (settingsError) {
      console.error('Get payin settings error:', settingsError);
      return NextResponse.json(
        { success: false, message: '获取代收设置失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '获取代收设置成功',
      data: settings || {
        enabled: false,
        max_amount: 0,
        daily_limit: 0,
        auto_accept: false,
      },
    });
  } catch (error) {
    console.error('Get payin settings error:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}

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

    const body: UpdateSettingsRequest = await request.json();
    const { enabled, maxAmount, dailyLimit, autoAccept } = body;

    if (maxAmount < 0 || dailyLimit < 0) {
      return NextResponse.json(
        { success: false, message: '金额和次数限制不能为负数' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient(token);

    const { data: existingSettings, error: existingError } = await client
      .from('user_settings')
      .select('id')
      .eq('user_id', payload.userId)
      .eq('setting_type', 'payin')
      .maybeSingle();

    if (existingError) {
      console.error('Check existing settings error:', existingError);
      return NextResponse.json(
        { success: false, message: '检查设置失败' },
        { status: 500 }
      );
    }

    if (existingSettings) {
      // 更新现有设置
      const { data: updatedSettings, error: updateError } = await client
        .from('user_settings')
        .update({
          enabled,
          max_amount: maxAmount,
          daily_limit: dailyLimit,
          auto_accept: autoAccept,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingSettings.id)
        .select()
        .single();

      if (updateError) {
        console.error('Update settings error:', updateError);
        return NextResponse.json(
          { success: false, message: '更新设置失败' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: '更新代收设置成功',
        data: updatedSettings,
      });
    } else {
      // 创建新设置
      const { data: newSettings, error: insertError } = await client
        .from('user_settings')
        .insert({
          user_id: payload.userId,
          setting_type: 'payin',
          enabled,
          max_amount: maxAmount,
          daily_limit: dailyLimit,
          auto_accept: autoAccept,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Create settings error:', insertError);
        return NextResponse.json(
          { success: false, message: '创建设置失败' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: '创建代收设置成功',
        data: newSettings,
      });
    }
  } catch (error) {
    console.error('Update payin settings error:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}
