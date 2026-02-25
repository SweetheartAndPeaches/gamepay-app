import { NextResponse } from 'next/server';
import { supabaseQuery } from '@/storage/database/supabase-rest';

export async function GET() {
  try {
    // 测试数据库连接并检查是否使用了 SERVICE_ROLE_KEY
    const { url, apiKey, useServiceRole } = (() => {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      const apiKey = serviceRoleKey || anonKey!;
      const useServiceRole = !!serviceRoleKey;

      return {
        url,
        apiKey,
        useServiceRole,
      };
    })();

    // 测试查询
    const tasks = await supabaseQuery('orders', {
      filter: {
        type: 'payout',
        status: 'pending',
      },
      limit: 1,
    });

    return NextResponse.json({
      success: true,
      message: 'Security configuration check successful',
      data: {
        usingServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        apiKeyPrefix: apiKey.substring(0, 20) + '...',
        apiKeyType: apiKey === process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SERVICE_ROLE_KEY' : 'ANON_KEY',
        querySuccessful: true,
        resultCount: tasks.length,
      },
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: 'Security configuration check failed',
      error: error.message,
    }, { status: 500 });
  }
}
