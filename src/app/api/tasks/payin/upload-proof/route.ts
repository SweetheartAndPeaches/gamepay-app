import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyToken } from '@/lib/jwt';
import { S3Storage } from 'coze-coding-dev-sdk';

/**
 * 上传支付凭证API
 * 用户上传支付凭证图片，保存到对象存储
 */
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

    // 获取表单数据
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const orderId = formData.get('orderId') as string;

    // 验证参数
    if (!file) {
      return NextResponse.json(
        { success: false, message: '请选择要上传的文件' },
        { status: 400 }
      );
    }

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: '订单 ID 不能为空' },
        { status: 400 }
      );
    }

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: '仅支持 JPG、PNG、GIF、WebP 格式的图片' },
        { status: 400 }
      );
    }

    // 验证文件大小（最大 10MB）
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, message: '文件大小不能超过 10MB' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();

    // 检查订单是否属于当前用户
    const { data: order, error: orderError } = await client
      .from('payin_orders')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', payload.userId)
      .in('status', ['created', 'paying'])
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { success: false, message: '订单不存在或状态不正确' },
        { status: 404 }
      );
    }

    // 初始化对象存储客户端
    const storage = new S3Storage({
      endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
      accessKey: '',
      secretKey: '',
      bucketName: process.env.COZE_BUCKET_NAME,
      region: 'cn-beijing',
    });

    // 读取文件内容
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 生成文件名：payin-proof-{orderId}-{timestamp}.{ext}
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `payin-proof-${orderId}-${Date.now()}.${ext}`;

    // 上传文件到对象存储
    const fileKey = await storage.uploadFile({
      fileContent: buffer,
      fileName: fileName,
      contentType: file.type,
    });

    // 生成签名 URL（有效期 7 天）
    const signedUrl = await storage.generatePresignedUrl({
      key: fileKey,
      expireTime: 604800, // 7 天 = 7 * 24 * 60 * 60 秒
    });

    // 更新订单，保存支付凭证URL
    const { error: updateOrderError } = await client
      .from('payin_orders')
      .update({
        transfer_proof_url: signedUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (updateOrderError) {
      console.error('Update order error:', updateOrderError);
      // 删除已上传的文件
      await storage.deleteFile({ fileKey });
      return NextResponse.json(
        { success: false, message: '上传凭证失败，请重试' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '上传凭证成功',
      data: {
        url: signedUrl,
        fileKey: fileKey,
      },
    });
  } catch (error) {
    console.error('Upload proof error:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}
