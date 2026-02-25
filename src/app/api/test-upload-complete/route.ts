import { NextResponse } from 'next/server';
import { supabaseQuery, supabaseUpdate } from '@/storage/database/supabase-rest';

export async function GET() {
  try {
    console.log('开始测试上传凭证和完成任务流程...');

    // 1. 获取用户
    const users = await supabaseQuery('users', {
      limit: 1,
    });

    if (users.length === 0) {
      return NextResponse.json({
        success: false,
        message: '没有用户',
      });
    }

    const userId = users[0].id;
    console.log('用户 ID:', userId);

    // 2. 获取已领取的任务
    const claimedTasks = await supabaseQuery('orders', {
      filter: {
        user_id: userId,
        type: 'payout',
        status: 'claimed',
      },
    });

    if (claimedTasks.length === 0) {
      return NextResponse.json({
        success: false,
        message: '没有已领取的任务',
      });
    }

    const task = claimedTasks[0];
    console.log('找到任务:', task.id, task.order_no);

    // 3. 检查当前状态
    console.log('当前状态:', task.status);
    console.log('是否已上传凭证:', !!task.payment_screenshot_url);

    // 4. 如果没有凭证，模拟上传凭证
    if (!task.payment_screenshot_url) {
      console.log('步骤1: 模拟上传支付凭证...');
      const updatedForProof = await supabaseUpdate(
        'orders',
        {
          payment_screenshot_url: 'https://example.com/screenshot.jpg',
          updated_at: new Date().toISOString(),
        },
        {
          id: task.id,
        }
      );

      console.log('凭证上传成功:', updatedForProof[0].payment_screenshot_url);

      return NextResponse.json({
        success: true,
        message: '上传凭证测试成功',
        data: {
          step: 'upload_proof',
          orderId: task.id,
          orderNo: task.order_no,
          screenshotUrl: updatedForProof[0].payment_screenshot_url,
          status: updatedForProof[0].status,
        },
      });
    }

    // 5. 如果已有凭证，模拟完成任务
    console.log('步骤2: 模拟完成任务...');
    const now = new Date();
    const updatedForComplete = await supabaseUpdate(
      'orders',
      {
        status: 'completed',
        task_completed_at: now.toISOString(),
        updated_at: now.toISOString(),
      },
      {
        id: task.id,
      }
    );

    // 6. 发放奖励
    const user = users[0];
    const reward = parseFloat(task.commission.toString());
    const newBalance = parseFloat(user.balance.toString()) + reward;

    await supabaseUpdate(
      'users',
      {
        balance: newBalance,
        updated_at: now.toISOString(),
      },
      {
        id: userId,
      }
    );

    console.log('任务完成！奖励:', reward, '新余额:', newBalance);

    return NextResponse.json({
      success: true,
      message: '完成任务测试成功',
      data: {
        step: 'complete_task',
        orderId: task.id,
        orderNo: task.order_no,
        status: updatedForComplete[0].status,
        reward,
        oldBalance: user.balance,
        newBalance,
      },
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
