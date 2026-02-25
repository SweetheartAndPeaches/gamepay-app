'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/MainLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/i18n/context';
import { CreditCard, Clock, CheckCircle, AlertCircle, Wallet, Plus, ArrowDownCircle, ArrowUpCircle, Shield } from 'lucide-react';
import PayinTaskDetailDialog from '@/components/PayinTaskDetailDialog';
import { toast } from 'sonner';

interface Order {
  id: string;
  order_no: string;
  amount: number;
  commission: number;
  status: 'pending' | 'claimed' | 'completed' | 'expired' | 'cancelled';
  payment_method: string | null;
  payment_account_info: any;
  transfer_proof_url: string | null;
  expires_at: string;
  created_at: string;
}

interface Account {
  id: string;
  type: string;
  account_name: string;
  account_number: string;
  bank_name: string | null;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data?: any;
}

export default function PayinTasksPage() {
  const { t, formatCurrency } = useI18n();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'hall' | 'claimed'>('hall');
  const [availableTasks, setAvailableTasks] = useState<Order[]>([]);
  const [claimedTasks, setClaimedTasks] = useState<Order[]>([]);
  const [activeTask, setActiveTask] = useState<Order | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userBalance, setUserBalance] = useState(0);
  const [enabled, setEnabled] = useState(true);
  const [hasAccounts, setHasAccounts] = useState(true);
  const [accounts, setAccounts] = useState<Account[]>([]);

  // 统计数据
  const statistics = {
    availableBalance: userBalance,
    frozenBalance: activeTask ? activeTask.amount : 0,
    totalIncome: claimedTasks
      .filter((task) => task.status === 'completed')
      .reduce((sum, task) => sum + task.commission, 0),
    totalOutcome: claimedTasks
      .filter((task) => task.status === 'claimed')
      .reduce((sum, task) => sum + task.amount, 0),
  };

  // 格式化统计数据的金额
  const formatStatsCurrency = (value: number) => formatCurrency(value.toString());

  // 获取 token
  const getToken = () => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('token') || '';
  };

  // 获取可领取任务列表
  const fetchAvailableTasks = async () => {
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
        setAvailableTasks(data.data.tasks || []);
        setAccounts(data.data.accounts || []);

        // 如果用户有未完成的任务，添加到已领取列表
        if (data.data.activeTask) {
          setClaimedTasks([data.data.activeTask]);
          setActiveTask(data.data.activeTask);
          setActiveTab('claimed');
        }
      } else {
        toast.error(data.message || '获取任务列表失败');
      }
    } catch (error) {
      console.error('Fetch available tasks error:', error);
      toast.error('获取任务列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取已领取任务列表
  const fetchClaimedTasks = async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) return;

      const response = await fetch('/api/tasks/payin/claimed', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data: ApiResponse = await response.json();

      if (data.success) {
        setClaimedTasks(data.data || []);
      } else {
        toast.error(data.message || '获取已领取任务失败');
      }
    } catch (error) {
      console.error('Fetch claimed tasks error:', error);
      toast.error('获取已领取任务失败');
    } finally {
      setLoading(false);
    }
  };

  // 领取任务
  const handleClaim = async (orderId: string, accountId: string) => {
    try {
      setIsClaiming(true);
      const token = getToken();
      if (!token) return;

      const response = await fetch('/api/tasks/payin/claim', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId, accountId }),
      });

      const data: ApiResponse = await response.json();

      if (data.success) {
        toast.success(data.message || '领取任务成功');
        setSelectedOrder(null);
        await fetchAvailableTasks();
        setActiveTab('claimed');
      } else {
        toast.error(data.message || '领取任务失败');
      }
    } catch (error) {
      console.error('Claim task error:', error);
      toast.error('领取任务失败');
    } finally {
      setIsClaiming(false);
    }
  };

  // 确认代收完成
  const handleConfirm = async (orderId: string) => {
    try {
      setIsConfirming(true);
      const token = getToken();
      if (!token) return;

      const response = await fetch('/api/tasks/payin/confirm', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId }),
      });

      const data: ApiResponse = await response.json();

      if (data.success) {
        toast.success(`代收完成，奖励 +${formatCurrency(data.data.commission)}`);
        setSelectedOrder(null);
        await fetchAvailableTasks();
        await fetchClaimedTasks();
      } else {
        toast.error(data.message || '确认失败');
      }
    } catch (error) {
      console.error('Confirm task error:', error);
      toast.error('确认失败');
    } finally {
      setIsConfirming(false);
    }
  };

  // 上传转账凭证
  const handleUploadProof = async (taskId: string, proofUrl: string) => {
    try {
      setIsUploading(true);
      const token = getToken();
      if (!token) return;

      const response = await fetch('/api/tasks/payin/upload-proof', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ taskId, proofUrl }),
      });

      const data: ApiResponse = await response.json();

      if (data.success) {
        toast.success('上传凭证成功');
        await fetchAvailableTasks();
      } else {
        toast.error(data.message || '上传凭证失败');
      }
    } catch (error) {
      console.error('Upload proof error:', error);
      toast.error('上传凭证失败');
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline">{t('tasks.payout.status.pending')}</Badge>;
      case 'claimed':
        return <Badge variant="secondary">{t('tasks.payout.inProgress')}</Badge>;
      case 'completed':
        return <Badge variant="default">{t('tasks.payout.completed')}</Badge>;
      case 'expired':
        return <Badge variant="destructive">{t('common.error')}</Badge>;
      case 'cancelled':
        return <Badge variant="secondary">{t('common.cancel')}</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const isExpiringSoon = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    return diff > 0 && diff < 5 * 60 * 1000; // 5 分钟内
  };

  useEffect(() => {
    fetchAvailableTasks();
  }, []);

  useEffect(() => {
    if (activeTab === 'claimed') {
      fetchClaimedTasks();
    }
  }, [activeTab]);

  return (
    <MainLayout showBalance={false}>
      <div className="p-4 space-y-4">
        <h1 className="text-xl font-bold text-gray-900">{t('tasks.payin.title')}</h1>

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
                  {t('balance.frozen')}: {formatStatsCurrency(statistics.frozenBalance)}
                </span>
              </div>
            </div>
            <div className="text-3xl font-bold mb-4">
              {formatStatsCurrency(statistics.availableBalance)}
            </div>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-1">
                <ArrowDownCircle className="w-4 h-4 opacity-75" />
                <span>
                  {t('balanceHistory.totalIncome')}: {formatStatsCurrency(statistics.totalIncome)}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <ArrowUpCircle className="w-4 h-4 opacity-75" />
                <span>
                  {t('balanceHistory.totalOutcome')}: {formatStatsCurrency(statistics.totalOutcome)}
                </span>
              </div>
            </div>
          </Card>
        )}

        {/* 提示卡片 */}
        {enabled && hasAccounts && activeTask && (
          <Card className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6" />
              <div>
                <p className="font-semibold">您有未完成的任务</p>
                <p className="text-sm opacity-90">请先完成当前任务后再领取新任务</p>
              </div>
            </div>
          </Card>
        )}

        {/* 任务统计 */}
        {enabled && hasAccounts && !activeTask && (
          <Card className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <div className="flex items-center gap-3 mb-2">
              <CreditCard className="w-8 h-8" />
              <div>
                <p className="text-sm opacity-90">可接收任务</p>
                <p className="text-2xl font-bold">
                  {availableTasks.length} 个
                </p>
              </div>
            </div>
            <p className="text-xs opacity-80">
              完成代收任务赚取佣金奖励
            </p>
          </Card>
        )}

        {/* 任务列表 */}
        {enabled && hasAccounts && (
          <>
            {availableTasks.length === 0 && !activeTask && (
              <Card className="p-8 text-center">
                <Wallet className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-gray-600 mb-2">暂无可用任务</p>
                <p className="text-sm text-gray-500">
                  您的余额为 {formatCurrency(userBalance)}，请充值或等待新任务
                </p>
              </Card>
            )}

            {/* 任务列表 */}
            {availableTasks.map((order) => (
              <Card key={order.id} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {order.order_no}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isExpiringSoon(order.expires_at) && (
                      <Badge variant="destructive" className="text-xs">
                        {t('tasks.payin.expiringSoon')}
                      </Badge>
                    )}
                    {getStatusBadge(order.status)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <p className="text-xs text-gray-600">{t('tasks.payin.payinAmount')}</p>
                    <p className="font-bold text-gray-900">
                      {formatCurrency(order.amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">{t('tasks.payin.reward')}</p>
                    <p className="font-bold text-green-600">
                      +{formatCurrency(order.commission)}
                    </p>
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={() => setSelectedOrder(order)}
                >
                  {t('tasks.payin.viewDetails')} & {t('tasks.payin.claim')}
                </Button>
              </Card>
            ))}

            {/* 已领取任务 */}
            {activeTab === 'claimed' && claimedTasks.map((order) => (
              <Card key={order.id} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {order.order_no}
                    </span>
                  </div>
                  {getStatusBadge(order.status)}
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <p className="text-xs text-gray-600">代收金额</p>
                    <p className="font-bold text-gray-900">
                      {formatCurrency(order.amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">任务奖励</p>
                    <p className="font-bold text-green-600">
                      +{formatCurrency(order.commission)}
                    </p>
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={() => setSelectedOrder(order)}
                >
                  {order.status === 'claimed' ? '确认已收到款项' : '查看详情'}
                </Button>
              </Card>
            ))}
          </>
        )}

        {/* 任务详情弹窗 */}
        <PayinTaskDetailDialog
          order={selectedOrder}
          open={!!selectedOrder}
          onOpenChange={(open) => !open && setSelectedOrder(null)}
          onClaim={handleClaim}
          onUploadProof={handleUploadProof}
          onConfirm={handleConfirm}
          isClaiming={isClaiming}
          isUploading={isUploading}
          isConfirming={isConfirming}
          userBalance={userBalance}
          accounts={accounts}
          enabled={enabled}
        />
      </div>
    </MainLayout>
  );
}
