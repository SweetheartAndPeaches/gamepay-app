import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyToken, extractTokenFromHeader } from '@/lib/jwt';
import { S3Storage } from 'coze-coding-dev-sdk';

/**
 * 获取单个账户详情
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const resolvedParams = await params;
    const client = getSupabaseClient();

    // 查询账户
    const { data: account, error } = await client
      .from('payment_accounts')
      .select('*')
      .eq('id', resolvedParams.id)
      .eq('user_id', payload.userId)
      .single();

    if (error || !account) {
      return NextResponse.json(
        { success: false, message: '账户不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        account: {
          id: account.id,
          accountType: account.account_type,
          accountInfo: account.account_info,
          isActive: account.is_active,
          payinEnabled: account.payin_enabled,
          payinMaxAmount: account.payin_max_amount,
          payinAllocatedAmount: account.payin_allocated_amount,
          payinEarnedCommission: account.payin_earned_commission,
          payinTotalCount: account.payin_total_count,
          createdAt: account.created_at,
          updatedAt: account.updated_at,
        }
      },
    });
  } catch (error) {
    console.error('Get account error:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}

/**
 * 更新账户
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const resolvedParams = await params;
    const formData = await request.formData();
    const accountName = formData.get('accountName') as string;
    const accountNumber = formData.get('accountNumber') as string;
    const bankName = formData.get('bankName') as string;
    const qrCodeFile = formData.get('qrCode') as File | null;
    const payinEnabled = formData.get('payinEnabled') === 'true';
    const payinMaxAmount = parseFloat(formData.get('payinMaxAmount') as string) || 0;

    const client = getSupabaseClient();

    // 查询原账户
    const { data: existingAccount, error: queryError } = await client
      .from('payment_accounts')
      .select('*')
      .eq('id', resolvedParams.id)
      .eq('user_id', payload.userId)
      .single();

    if (queryError || !existingAccount) {
      return NextResponse.json(
        { success: false, message: '账户不存在' },
        { status: 404 }
      );
    }

    // 构建更新数据
    const updateData: any = {
      account_info: { ...existingAccount.account_info },
      updated_at: new Date().toISOString(),
      // 代收设置（仅当账户类型是代收账户时）
      payin_enabled: existingAccount.account_type.includes('qrcode') ||
                     existingAccount.account_type === 'bank_card' ||
                     existingAccount.account_type === 'alipay_account'
                     ? payinEnabled
                     : false,
      payin_max_amount: existingAccount.account_type.includes('qrcode') ||
                        existingAccount.account_type === 'bank_card' ||
                        existingAccount.account_type === 'alipay_account'
                        ? payinMaxAmount
                        : 0,
    };

    // 更新名称
    if (accountName) {
      updateData.account_info.name = accountName;
    }

    // 对于非二维码账户，更新账号
    if (!existingAccount.account_type.includes('qrcode') && accountNumber) {
      updateData.account_info.accountNumber = accountNumber;
    }

    // 对于银行卡，更新开户银行
    if (existingAccount.account_type === 'bank_card' && bankName) {
      updateData.account_info.bankName = bankName;
    }

    // 上传新的二维码图片
    if (qrCodeFile && existingAccount.account_type.includes('qrcode')) {
      try {
        const storage = new S3Storage({
          endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
          accessKey: '',
          secretKey: '',
          bucketName: process.env.COZE_BUCKET_NAME,
          region: 'cn-beijing',
        });

        // 删除旧二维码
        if (existingAccount.account_info.qrCodeKey) {
          try {
            await storage.deleteFile({ fileKey: existingAccount.account_info.qrCodeKey });
          } catch (deleteError) {
            console.error('Delete old QR code error:', deleteError);
          }
        }

        // 上传新二维码
        const bytes = await qrCodeFile.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const fileKey = await storage.uploadFile({
          fileContent: buffer,
          fileName: `qrcodes/${payload.userId}/${Date.now()}-${qrCodeFile.name}`,
          contentType: qrCodeFile.type,
        });

        const qrCodeUrl = await storage.generatePresignedUrl({
          key: fileKey,
          expireTime: 86400 * 30, // 30 天
        });

        updateData.account_info.qrCodeKey = fileKey;
        updateData.account_info.qrCodeUrl = qrCodeUrl;
      } catch (uploadError) {
        console.error('Upload QR code error:', uploadError);
        return NextResponse.json(
          { success: false, message: '二维码上传失败' },
          { status: 500 }
        );
      }
    }

    // 更新账户
    const { data: updatedAccount, error: updateError } = await client
      .from('payment_accounts')
      .update(updateData)
      .eq('id', resolvedParams.id)
      .select()
      .single();

    if (updateError) {
      console.error('Update account error:', updateError);
      return NextResponse.json(
        { success: false, message: '更新账户失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '账户更新成功',
      data: {
        account: {
          id: updatedAccount.id,
          accountType: updatedAccount.account_type,
          accountInfo: updatedAccount.account_info,
          isActive: updatedAccount.is_active,
          payinEnabled: updatedAccount.payin_enabled,
          payinMaxAmount: updatedAccount.payin_max_amount,
          payinAllocatedAmount: updatedAccount.payin_allocated_amount,
          payinEarnedCommission: updatedAccount.payin_earned_commission,
          payinTotalCount: updatedAccount.payin_total_count,
          createdAt: updatedAccount.created_at,
          updatedAt: updatedAccount.updated_at,
        }
      },
    });
  } catch (error) {
    console.error('Update account error:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}

/**
 * 删除账户
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const resolvedParams = await params;
    const client = getSupabaseClient();

    // 查询账户
    const { data: account, error: queryError } = await client
      .from('payment_accounts')
      .select('*')
      .eq('id', resolvedParams.id)
      .eq('user_id', payload.userId)
      .single();

    if (queryError || !account) {
      return NextResponse.json(
        { success: false, message: '账户不存在' },
        { status: 404 }
      );
    }

    // 删除二维码图片
    if (account.account_type.includes('qrcode') && account.account_info.qrCodeKey) {
      try {
        const storage = new S3Storage({
          endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
          accessKey: '',
          secretKey: '',
          bucketName: process.env.COZE_BUCKET_NAME,
          region: 'cn-beijing',
        });
        await storage.deleteFile({ fileKey: account.account_info.qrCodeKey });
      } catch (deleteError) {
        console.error('Delete QR code error:', deleteError);
      }
    }

    // 删除账户（软删除，设置 is_active = false）
    const { error: deleteError } = await client
      .from('payment_accounts')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', resolvedParams.id);

    if (deleteError) {
      console.error('Delete account error:', deleteError);
      return NextResponse.json(
        { success: false, message: '删除账户失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '账户删除成功',
    });
  } catch (error) {
    console.error('Delete account error:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}
