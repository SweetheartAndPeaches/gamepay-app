import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('开始测试完成任务 API...');

    // 获取用户 token
    const tokenResp = await fetch('http://localhost:5000/api/test-token');
    const tokenData = await tokenResp.json();

    if (!tokenData.success) {
      return NextResponse.json({
        success: false,
        message: '获取 token 失败',
      });
    }

    const token = tokenData.data.token;

    // 获取用户的已领取任务
    const { supabaseQuery } = await import('@/storage/database/supabase-rest');
    const claimedTasks = await supabaseQuery('orders', {
      filter: {
        type: 'payout',
        status: 'claimed',
      },
    });

    if (claimedTasks.length === 0) {
      return NextResponse.json({
        success: false,
        message: '没有可测试的任务',
      });
    }

    const task = claimedTasks[0];
    console.log('找到任务:', task.id, task.order_no);

    // 测试完成任务 API
    const completeResp = await fetch('http://localhost:5000/api/tasks/payout/complete', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderId: task.id,
      }),
    });

    const completeData = await completeResp.json();
    console.log('完成任务响应:', completeData);

    return NextResponse.json({
      success: completeData.success,
      message: completeData.message,
      data: completeData.data,
      status: completeResp.status,
    });
  } catch (error: any) {
    console.error('测试失败:', error);
    return NextResponse.json({
      success: false,
      message: '测试失败',
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}
