import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyToken, extractTokenFromHeader } from '@/lib/jwt';
import { S3Storage } from 'coze-coding-dev-sdk';

/**
 * 获取账户列表
 */
export async function GET(request: NextRequest) {
  try {
    // 验证 Token
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

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

    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // payin 或 payout

    if (!type || !['payin', 'payout'].includes(type)) {
      return NextResponse.json(
        { success: false, message: '无效的账户类型' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();

    // 查询账户
    const { data: accounts, error } = await client
      .from('payment_accounts')
      .select('*')
      .eq('user_id', payload.userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get accounts error:', error);
      return NextResponse.json(
        { success: false, message: '获取账户列表失败' },
        { status: 500 }
      );
    }

    // 根据类型过滤账户
    const payinTypes = ['wechat_qrcode', 'alipay_qrcode', 'alipay_account', 'bank_card'];
    const payoutTypes = ['wechat_qrcode', 'alipay_qrcode', 'alipay_account'];

    const filteredAccounts = accounts?.filter((account: any) => {
      const accountType = account.account_type;
      if (type === 'payin') {
        return payinTypes.includes(accountType);
      } else {
        return payoutTypes.includes(accountType);
      }
    }) || [];

    // 检查是否超过限制（默认 5 个）
    const maxAccounts = 5;
    if (filteredAccounts.length >= maxAccounts) {
      return NextResponse.json({
        success: true,
        data: {
          accounts: filteredAccounts,
          canAdd: false,
          maxAccounts,
          message: `已达到最大账户数量（${maxAccounts}个）`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        accounts: filteredAccounts,
        canAdd: true,
        maxAccounts,
      },
    });
  } catch (error) {
    console.error('Get accounts error:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}

/**
 * 添加账户
 */
export async function POST(request: NextRequest) {
  try {
    // 验证 Token
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

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

    const formData = await request.formData();
    const accountType = formData.get('accountType') as string;
    const accountName = formData.get('accountName') as string;
    const accountNumber = formData.get('accountNumber') as string;
    const bankName = formData.get('bankName') as string;
    const usageType = formData.get('usageType') as string; // payin 或 payout
    const qrCodeFile = formData.get('qrCode') as File | null;

    // 验证必填字段
    if (!accountType || !accountName) {
      return NextResponse.json(
        { success: false, message: '账户类型和名称不能为空' },
        { status: 400 }
      );
    }

    // 验证账户类型
    const payinTypes = ['wechat_qrcode', 'alipay_qrcode', 'alipay_account', 'bank_card'];
    const payoutTypes = ['wechat_qrcode', 'alipay_qrcode', 'alipay_account'];

    if (usageType === 'payin' && !payinTypes.includes(accountType)) {
      return NextResponse.json(
        { success: false, message: '代收账户类型无效' },
        { status: 400 }
      );
    }

    if (usageType === 'payout' && !payoutTypes.includes(accountType)) {
      return NextResponse.json(
        { success: false, message: '代付账户类型无效' },
        { status: 400 }
      );
    }

    // 对于非二维码账户，验证账号
    if (!accountType.includes('qrcode') && !accountNumber) {
      return NextResponse.json(
        { success: false, message: '账号不能为空' },
        { status: 400 }
      );
    }

    // 对于银行卡，验证开户银行
    if (accountType === 'bank_card' && !bankName) {
      return NextResponse.json(
        { success: false, message: '开户银行不能为空' },
        { status: 400 }
      );
    }

    // 对于二维码账户，验证二维码文件
    if (accountType.includes('qrcode') && !qrCodeFile) {
      return NextResponse.json(
        { success: false, message: '二维码图片不能为空' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();

    // 检查账户数量限制
    const { data: existingAccounts } = await client
      .from('payment_accounts')
      .select('id')
      .eq('user_id', payload.userId)
      .eq('is_active', true);

    if (existingAccounts && existingAccounts.length >= 5) {
      return NextResponse.json(
        { success: false, message: '已达到最大账户数量（5个）' },
        { status: 400 }
      );
    }

    // 上传二维码图片
    let qrCodeUrl = null;
    let qrCodeKey = null;

    if (qrCodeFile) {
      try {
        const storage = new S3Storage({
          endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
          accessKey: '',
          secretKey: '',
          bucketName: process.env.COZE_BUCKET_NAME,
          region: 'cn-beijing',
        });

        const bytes = await qrCodeFile.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const fileKey = await storage.uploadFile({
          fileContent: buffer,
          fileName: `qrcodes/${payload.userId}/${Date.now()}-${qrCodeFile.name}`,
          contentType: qrCodeFile.type,
        });

        qrCodeKey = fileKey;
        qrCodeUrl = await storage.generatePresignedUrl({
          key: fileKey,
          expireTime: 86400 * 30, // 30 天
        });
      } catch (uploadError) {
        console.error('Upload QR code error:', uploadError);
        return NextResponse.json(
          { success: false, message: '二维码上传失败' },
          { status: 500 }
        );
      }
    }

    // 构建账户信息
    const accountInfo: any = {
      name: accountName,
    };

    if (accountType.includes('qrcode')) {
      accountInfo.qrCodeKey = qrCodeKey;
      accountInfo.qrCodeUrl = qrCodeUrl;
    } else {
      accountInfo.accountNumber = accountNumber;
    }

    if (accountType === 'bank_card') {
      accountInfo.bankName = bankName;
    }

    // 创建账户
    const { data: newAccount, error: createError } = await client
      .from('payment_accounts')
      .insert({
        user_id: payload.userId,
        account_type: accountType,
        account_info: accountInfo,
        is_active: true,
      })
      .select()
      .single();

    if (createError) {
      console.error('Create account error:', createError);
      // 如果创建失败，删除已上传的二维码
      if (qrCodeKey) {
        try {
          const storage = new S3Storage({
            endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
            accessKey: '',
            secretKey: '',
            bucketName: process.env.COZE_BUCKET_NAME,
            region: 'cn-beijing',
          });
          await storage.deleteFile({ fileKey: qrCodeKey });
        } catch (deleteError) {
          console.error('Delete QR code error:', deleteError);
        }
      }
      return NextResponse.json(
        { success: false, message: '添加账户失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '账户添加成功',
      data: { account: newAccount },
    });
  } catch (error) {
    console.error('Add account error:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}
