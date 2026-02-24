import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    const response: any = {
      success: true,
      message: '诊断信息',
      data: {
        tokenExists: !!token,
        tokenLength: token?.length || 0,
        tables: {},
      },
    };

    if (token) {
      const client = getSupabaseClient(token);

      // 检查 users 表
      try {
        const { data: usersData, error: usersError } = await client
          .from('users')
          .select('id')
          .limit(1);

        response.data.tables.users = {
          exists: !usersError,
          error: usersError?.message,
        };
      } catch (e) {
        response.data.tables.users = { error: (e as Error).message };
      }

      // 检查 user_settings 表
      try {
        const { data: settingsData, error: settingsError } = await client
          .from('user_settings')
          .select('id')
          .limit(1);

        response.data.tables.user_settings = {
          exists: !settingsError,
          error: settingsError?.message,
          count: settingsData?.length || 0,
        };
      } catch (e) {
        response.data.tables.user_settings = { error: (e as Error).message };
      }

      // 检查 orders 表
      try {
        const { data: ordersData, error: ordersError } = await client
          .from('orders')
          .select('id')
          .limit(1);

        response.data.tables.orders = {
          exists: !ordersError,
          error: ordersError?.message,
        };
      } catch (e) {
        response.data.tables.orders = { error: (e as Error).message };
      }

      // 检查 bank_accounts 表
      try {
        const { data: accountsData, error: accountsError } = await client
          .from('bank_accounts')
          .select('id')
          .limit(1);

        response.data.tables.bank_accounts = {
          exists: !accountsError,
          error: accountsError?.message,
        };
      } catch (e) {
        response.data.tables.bank_accounts = { error: (e as Error).message };
      }
    }

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: '诊断失败',
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
  }
}
