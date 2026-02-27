import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyToken } from '@/lib/jwt';

interface UploadProofRequest {
  taskId: string;
  transferProofUrl: string;
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

    const body: UploadProofRequest = await request.json();
    const { taskId, transferProofUrl } = body;

    if (!taskId) {
      return NextResponse.json(
        { success: false, message: '任务 ID 不能为空' },
        { status: 400 }
      );
    }

    if (!transferProofUrl) {
      return NextResponse.json(
        { success: false, message: '转账凭证不能为空' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();

    // 检查任务是否属于当前用户
    const { data: task, error: taskError } = await client
      .from('payin_task_allocations')
      .select('*')
      .eq('id', taskId)
      .eq('user_id', payload.userId)
      .eq('status', 'claimed')
      .single();

    if (taskError || !task) {
      return NextResponse.json(
        { success: false, message: '任务不存在或状态不正确' },
        { status: 404 }
      );
    }

    // 检查任务是否已过期
    if (new Date(task.expires_at) < new Date()) {
      return NextResponse.json(
        { success: false, message: '任务已过期，无法上传凭证' },
        { status: 400 }
      );
    }

    // 上传转账凭证
    const { data: updatedTask, error: updateError } = await client
      .from('payin_task_allocations')
      .update({
        transfer_proof_url: transferProofUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId)
      .select()
      .single();

    if (updateError) {
      console.error('Upload proof error:', updateError);
      return NextResponse.json(
        { success: false, message: '上传转账凭证失败，请重试' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '上传转账凭证成功',
      data: updatedTask,
    });
  } catch (error) {
    console.error('Upload proof error:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}
