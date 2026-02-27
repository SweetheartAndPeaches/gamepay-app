'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/MainLayout';
import PageHeader from '@/components/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useI18n } from '@/i18n/context';
import { CreditCard, Clock, CheckCircle, AlertCircle, Wallet, Plus, ArrowDownCircle, ArrowUpCircle, Shield, Upload, Loader2, RefreshCw, HelpCircle, Bell } from 'lucide-react';
import { toast } from 'sonner';

interface PayinOrder {
  id: string;
  order_no: string;
  amount: number;
  commission: number;
  status: 'created' | 'paying' | 'success' | 'failed' | 'closed';
  payment_method: string;
  payment_currency: string;
  transfer_proof_url: string | null;
  pay_order_id: string | null;
  expires_at: string;
  created_at: string;
}

interface Account {
  id: string;
  account_type: string;
  account_info: any;
  account_name: string;
  account_number: string;
  bank_name: string | null;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data?: any;
}

type PageState = 'idle' | 'creating' | 'paying' | 'uploading' | 'confirming';

export default function PayinTasksPage() {
  const { t, formatCurrency } = useI18n();
  const router = useRouter();

  const [pageState, setPageState] = useState<PageState>('idle');
  const [userBalance, setUserBalance] = useState(0);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [amount, setAmount] = useState('');
  const [activeOrder, setActiveOrder] = useState<PayinOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(true);
  const [hasAccounts, setHasAccounts] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // 统计数据
  const statistics = {
    availableBalance: userBalance,
    frozenBalance: activeOrder && (activeOrder.status === 'created' || activeOrder.status === 'paying') ? activeOrder.amount : 0,
  };

  // 获取 token
  const getToken = () => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('token') || '';
  };

  // 获取用户信息和账户列表
  const fetchUserInfo = async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) return;

      const response = await fetch('/api/tasks/payin/available', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data: ApiResponse = await response.json();

      if (data.success) {
        setEnabled(data.data.enabled);
        setHasAccounts(data.data.hasAccounts);
        setUserBalance(data.data.userBalance || 0);
        setAccounts(data.data.accounts || []);

        // 如果用户有未完成的订单，显示订单详情
        if (data.data.activeTask) {
          setActiveOrder(data.data.activeTask);
          setPageState('paying');
        }
      } else {
        toast.error(data.message || '获取用户信息失败');
      }
    } catch (error) {
      console.error('Fetch user info error:', error);
      toast.error('获取用户信息失败');
    } finally {
      setLoading(false);
    }
  };

  // 切换账户选择状态
  const toggleAccountSelection = (accountId: string) => {
    setSelectedAccountIds(prev => {
      if (prev.includes(accountId)) {
        return prev.filter(id => id !== accountId);
      } else {
        return [...prev, accountId];
      }
    });
  };

  // 创建代收订单
  const handleCreateOrder = async () => {
    if (selectedAccountIds.length === 0) {
      toast.error('请选择至少一个代收账户');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('请输入有效的代收金额');
      return;
    }

    const amountValue = parseFloat(amount);

    if (amountValue > userBalance) {
      toast.error(`余额不足，需要 ${amountValue} 元，当前余额 ${userBalance} 元`);
      return;
    }

    try {
      setIsSubmitting(true);
      setPageState('creating');

      const token = getToken();
      if (!token) return;

      const response = await fetch('/api/tasks/payin/create-order', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountIds: selectedAccountIds,
          amount: amountValue,
          paymentMethod: 'COLOMBIA_QR', // 默认使用哥伦比亚QR码
        }),
      });

      const data: ApiResponse = await response.json();

      if (data.success) {
        toast.success('订单创建成功');
        setActiveOrder(data.data.order);
        setPageState('paying');
        setAmount('');
        setSelectedAccountIds([]);
      } else {
        // 处理API返回的错误
        const errorMessage = data.message || '创建订单失败';
        console.error('API Error:', errorMessage, { response: data });
        toast.error(errorMessage);
        setPageState('idle');
      }
    } catch (error) {
      // 处理网络错误或其他异常
      console.error('Create order error:', error);
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        toast.error('网络连接失败，请检查网络设置');
      } else {
        toast.error('创建订单失败，请稍后重试');
      }
      setPageState('idle');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 上传支付凭证
  const handleUploadProof = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!activeOrder) {
      toast.error('订单不存在');
      return;
    }

    try {
      setIsUploading(true);
      setPageState('uploading');

      const token = getToken();
      if (!token) return;

      // 创建 FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('orderId', activeOrder.id);

      // 模拟上传进度
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += 20;
        if (progress < 90) {
          setUploadProgress(progress);
        } else {
          clearInterval(progressInterval);
        }
      }, 200);

      const response = await fetch('/api/tasks/payin/upload-proof', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const data: ApiResponse = await response.json();

      if (data.success) {
        toast.success('上传凭证成功');
        setActiveOrder({
          ...activeOrder,
          transfer_proof_url: data.data.url,
        });
        setPageState('confirming');
      } else {
        toast.error(data.message || '上传凭证失败');
        setPageState('paying');
      }
    } catch (error) {
      console.error('Upload proof error:', error);
      toast.error('上传凭证失败');
      setPageState('paying');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // 确认收款
  const handleConfirmReceipt = async () => {
    if (!activeOrder || !activeOrder.transfer_proof_url) {
      toast.error('请先上传支付凭证');
      return;
    }

    try {
      setIsConfirming(true);

      const token = getToken();
      if (!token) return;

      const response = await fetch('/api/tasks/payin/confirm-receipt', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: activeOrder.id,
          transferProofUrl: activeOrder.transfer_proof_url,
        }),
      });

      const data: ApiResponse = await response.json();

      if (data.success) {
        toast.success(`确认收款成功，奖励 +${formatCurrency(data.data.commission)}`);
        setActiveOrder({
          ...activeOrder,
          status: 'success',
        });
        setPageState('idle');
        await fetchUserInfo();
      } else {
        toast.error(data.message || '确认收款失败');
      }
    } catch (error) {
      console.error('Confirm receipt error:', error);
      toast.error('确认收款失败');
    } finally {
      setIsConfirming(false);
    }
  };

  // 取消订单（用于测试）
  const handleCancelOrder = async () => {
    toast.info('请联系客服取消订单');
  };

  // 获取订单状态显示
  const getOrderStatusBadge = (status: PayinOrder['status']) => {
    switch (status) {
      case 'created':
        return <Badge variant="secondary">已创建</Badge>;
      case 'paying':
        return <Badge variant="default">支付中</Badge>;
      case 'success':
        return <Badge variant="default" className="bg-green-600">支付成功</Badge>;
      case 'failed':
        return <Badge variant="destructive">支付失败</Badge>;
      case 'closed':
        return <Badge variant="outline">已关闭</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // 格式化时间
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  useEffect(() => {
    fetchUserInfo();
  }, []);

  return (
    <MainLayout showBalance={false}>
      <div className="p-4 space-y-4">
        <PageHeader
          title={t('tasks.payin.title')}
          gradient="blue"
          showRefresh={true}
          onRefresh={fetchUserInfo}
          showNotification={true}
          notificationCount={2}
          onNotification={() => {/* TODO: 打开消息通知 */}}
        />

        {/* 系统未开启提示 */}
        {!enabled && (
          <Card className="p-4 bg-gradient-to-br from-red-500 to-red-600 text-white">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6" />
              <div>
                <p className="font-semibold">代收任务暂未开启</p>
                <p className="text-sm opacity-90">系统维护中，请稍后再试</p>
              </div>
            </div>
          </Card>
        )}

        {/* 需要添加代收账户 */}
        {enabled && !hasAccounts && (
          <Card className="p-4 bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6" />
              <div className="flex-1">
                <p className="font-semibold">请先设置代收账户</p>
                <p className="text-sm opacity-90">添加代收账户后才能接收代收任务</p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => router.push('/profile/accounts')}
              >
                <Plus className="w-4 h-4 mr-2" />
                添加账户
              </Button>
            </div>
          </Card>
        )}

        {/* 余额卡片 */}
        {enabled && hasAccounts && (
          <Card className="p-4 bg-gradient-to-br from-blue-600 to-blue-700 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                <span className="text-sm opacity-90">{t('balance.available')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 opacity-75" />
                <span className="text-sm opacity-75">
                  {t('balance.frozen')}: {formatCurrency(statistics.frozenBalance)}
                </span>
              </div>
            </div>
            <div className="text-3xl font-bold">
              {formatCurrency(statistics.availableBalance)}
            </div>
          </Card>
        )}

        {/* 页面状态：空闲 - 显示创建订单表单 */}
        {enabled && hasAccounts && pageState === 'idle' && (
          <Card className="p-4">
            <h2 className="text-lg font-semibold mb-4">代收任务配置</h2>

            {/* 选择代收账户 - 支持多选 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                选择代收账户（可多选）
                <span className="text-blue-600 ml-2">
                  已选择 {selectedAccountIds.length} 个账户
                </span>
              </label>
              <div className="space-y-2">
                {accounts.map((account) => {
                  const isSelected = selectedAccountIds.includes(account.id);
                  return (
                    <div
                      key={account.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => toggleAccountSelection(account.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          toggleAccountSelection(account.id);
                        }
                      }}
                      className={`w-full p-3 border rounded-lg text-left transition-colors flex items-center gap-3 cursor-pointer ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Checkbox
                        checked={isSelected}
                        onChange={() => {}}
                        className="pointer-events-none"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {account.account_type === 'wechat_qrcode' && '微信收款码'}
                          {account.account_type === 'alipay_qrcode' && '支付宝收款码'}
                          {account.account_type === 'alipay_account' && '支付宝账号'}
                          {account.account_type === 'bank_card' && '银行卡'}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {account.account_number}
                        </div>
                      </div>
                      {isSelected && (
                        <CheckCircle className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                  );
                })}
              </div>
              {selectedAccountIds.length === 0 && (
                <p className="text-xs text-gray-500 mt-2">
                  请至少选择一个代收账户
                </p>
              )}
            </div>

            {/* 设置代收金额 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                代收金额（元）
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="请输入代收金额"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                max={userBalance}
                min="0"
                step="0.01"
              />
              <p className="text-xs text-gray-500 mt-1">
                可用余额：{formatCurrency(userBalance)}
              </p>
            </div>

            {/* 提示信息 */}
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>注意事项：</strong>
              </p>
              <ul className="text-xs text-yellow-700 mt-1 list-disc list-inside space-y-1">
                <li>创建订单后会冻结相应的余额</li>
                <li>订单有效期为 30 分钟</li>
                <li>您可以同时使用多个代收账户接收款项</li>
                <li>请检查任一账户是否收到款项后上传凭证</li>
                <li>佣金为订单金额的 5%</li>
              </ul>
            </div>

            {/* 创建订单按钮 */}
            <Button
              className="w-full"
              onClick={handleCreateOrder}
              disabled={isSubmitting || selectedAccountIds.length === 0 || !amount}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  创建中...
                </>
              ) : (
                '开始任务'
              )}
            </Button>
          </Card>
        )}

        {/* 页面状态：创建中 - 显示加载动画 */}
        {pageState === 'creating' && (
          <Card className="p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <RefreshCw className="w-12 h-12 animate-spin text-blue-600" />
              <div>
                <p className="text-lg font-semibold text-gray-900">正在分配任务...</p>
                <p className="text-sm text-gray-600 mt-1">正在调用支付平台接口，请稍候</p>
              </div>
            </div>
          </Card>
        )}

        {/* 页面状态：支付中 - 显示订单信息和上传凭证 */}
        {(pageState === 'paying' || pageState === 'uploading' || pageState === 'confirming') && activeOrder && (
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">订单详情</h2>
              {getOrderStatusBadge(activeOrder.status)}
            </div>

            {/* 订单信息 */}
            <div className="space-y-3 mb-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">订单号</span>
                <span className="text-sm font-medium">{activeOrder.order_no}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">代收金额</span>
                <span className="text-sm font-bold text-gray-900">{formatCurrency(activeOrder.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">任务奖励</span>
                <span className="text-sm font-bold text-green-600">+{formatCurrency(activeOrder.commission)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">创建时间</span>
                <span className="text-sm">{formatTime(activeOrder.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">过期时间</span>
                <span className="text-sm">{formatTime(activeOrder.expires_at)}</span>
              </div>
              {activeOrder.pay_order_id && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">支付平台订单号</span>
                  <span className="text-sm">{activeOrder.pay_order_id}</span>
                </div>
              )}
            </div>

            {/* 提示信息 */}
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>操作指引：</strong>
              </p>
              <ol className="text-xs text-blue-700 mt-1 list-decimal list-inside space-y-1">
                <li>检查您的任一代收账户是否收到款项</li>
                <li>上传支付凭证（截图或转账记录）</li>
                <li>确认已收到款项，系统将发放佣金</li>
              </ol>
            </div>

            {/* 上传凭证区域 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                上传支付凭证
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                {activeOrder.transfer_proof_url ? (
                  <div className="space-y-2">
                    <CheckCircle className="w-12 h-12 mx-auto text-green-600" />
                    <p className="text-sm text-gray-600">凭证已上传</p>
                    <a
                      href={activeOrder.transfer_proof_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 text-sm hover:underline"
                    >
                      查看凭证
                    </a>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-12 h-12 mx-auto text-gray-400" />
                    <p className="text-sm text-gray-600">点击或拖拽上传凭证</p>
                    <p className="text-xs text-gray-500">支持 JPG、PNG、GIF、WebP 格式，最大 10MB</p>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      onChange={handleUploadProof}
                      disabled={isUploading}
                      className="hidden"
                      id="proof-upload"
                    />
                    <label
                      htmlFor="proof-upload"
                      className={`inline-block px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer text-sm hover:bg-blue-700 transition-colors ${
                        isUploading ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 inline animate-spin" />
                          上传中... {uploadProgress}%
                        </>
                      ) : (
                        '选择文件'
                      )}
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* 确认收款按钮 */}
            {pageState === 'confirming' && (
              <Button
                className="w-full"
                onClick={handleConfirmReceipt}
                disabled={isConfirming}
              >
                {isConfirming ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    确认中...
                  </>
                ) : (
                  '已收到款项，确认收款'
                )}
              </Button>
            )}

            {/* 取消订单按钮 */}
            {pageState === 'paying' && (
              <Button
                variant="outline"
                className="w-full"
                onClick={handleCancelOrder}
                disabled={isUploading}
              >
                取消订单
              </Button>
            )}
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
