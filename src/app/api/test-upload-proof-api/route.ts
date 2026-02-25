import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('开始测试上传凭证 API...');

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
    console.log('Token:', token.substring(0, 50) + '...');

    // 获取用户的 claimed 任务
    const ordersResp = await fetch('http://localhost:5000/api/test-orders');
    const ordersData = await ordersResp.json();

    // 查找没有凭证的 claimed 任务
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

    // 测试上传凭证 API
    const uploadResp = await fetch('http://localhost:5000/api/tasks/payout/upload-proof', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderId: task.id,
        screenshotUrl: 'https://example.com/test-screenshot.jpg',
      }),
    });

    const uploadData = await uploadResp.json();
    console.log('上传凭证响应:', uploadData);

    return NextResponse.json({
      success: uploadData.success,
      message: uploadData.message,
      data: uploadData.data,
      status: uploadResp.status,
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
