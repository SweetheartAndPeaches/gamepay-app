import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface ApiResponse {
  success: boolean;
  message: string;
  data?: any;
}

// GET - 获取用户已领取的代收任务
export async function GET(request: NextRequest) {
  try {
    // 从 Authorization header 获取 token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: '未授权访问',
      }, { status: 401 });
    }

    const token = authHeader.substring(7);

    // 解析 token 获取用户 ID
    let userId: string;
    try {
      const payload = JSON.parse(
        Buffer.from(token.split('.')[1], 'base64').toString()
      );
      userId = payload.userId;
    } catch (error) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: '无效的 token',
      }, { status: 401 });
    }

    // 查询用户信息
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: '用户不存在',
      }, { status: 404 });
    }

    // 查询用户已领取的代收任务
    const { data: tasks, error: tasksError } = await supabase
      .from('payin_task_allocations')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['claimed', 'completed'])
      .order('created_at', { ascending: false });

    if (tasksError) {
      console.error('Query payin tasks error:', tasksError);
      return NextResponse.json<ApiResponse>({
        success: false,
        message: '查询任务失败',
      }, { status: 500 });
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: '获取成功',
      data: tasks || [],
    });
  } catch (error) {
    console.error('Get claimed payin tasks error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      message: '获取已领取任务失败',
    }, { status: 500 });
  }
}
