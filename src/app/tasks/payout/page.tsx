'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/MainLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useI18n } from '@/i18n/context';
import { CreditCard, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import TaskDetailDialog from '@/components/TaskDetailDialog';
import { toast } from 'sonner';

interface Order {
  id: string;
  order_no: string;
  amount: number;
  commission: number;
  status: 'pending' | 'claimed' | 'completed' | 'expired' | 'cancelled';
  payment_method: string | null;
  payment_account: string | null;
  payment_screenshot_url: string | null;
  expires_at: string;
  created_at: string;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data?: any;
}

export default function PayoutTasksPage() {
  const { t, formatCurrency } = useI18n();

  const [activeTab, setActiveTab] = useState('hall');
  const [availableTasks, setAvailableTasks] = useState<Order[]>([]);
  const [claimedTasks, setClaimedTasks] = useState<Order[]>([]);
  const [activeTask, setActiveTask] = useState<Order | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [canClaim, setCanClaim] = useState(true);

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

      const response = await fetch('/api/tasks/payout/available', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data: ApiResponse = await response.json();

      if (data.success) {
        setCanClaim(data.data.canClaim);
        setAvailableTasks(data.data.tasks || []);

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

      const response = await fetch('/api/tasks/payout/claimed', {
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
  const handleClaim = async (orderId: string) => {
    try {
      setIsClaiming(true);
      const token = getToken();
      if (!token) return;

      const response = await fetch('/api/tasks/payout/claim', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId }),
      });

      const data: ApiResponse = await response.json();

      if (data.success) {
        toast.success('领取任务成功');
        await fetchAvailableTasks();
        await fetchClaimedTasks();
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

  // 上传支付凭证/完成任务
  const handleComplete = async (orderId: string, screenshotUrl: string) => {
    try {
      setIsCompleting(true);
      const token = getToken();
      if (!token) return;

      // 如果还没有上传凭证，先上传
      const order = claimedTasks.find(o => o.id === orderId);
      if (order && !order.payment_screenshot_url) {
        const uploadResponse = await fetch('/api/tasks/payout/upload-proof', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ orderId, screenshotUrl }),
        });

        const uploadData: ApiResponse = await uploadResponse.json();

        if (!uploadData.success) {
          toast.error(uploadData.message || '上传支付凭证失败');
          return;
        }

        toast.success('上传支付凭证成功');
        setSelectedOrder(null);
        await fetchClaimedTasks();
        return;
      }

      // 完成任务
      const response = await fetch('/api/tasks/payout/complete', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId }),
      });

      const data: ApiResponse = await response.json();

      if (data.success) {
        toast.success(`任务完成，奖励 +${formatCurrency(data.data.reward)}`);
        setSelectedOrder(null);
        await fetchAvailableTasks();
        await fetchClaimedTasks();
      } else {
        toast.error(data.message || '完成任务失败');
      }
    } catch (error) {
      console.error('Complete task error:', error);
      toast.error('完成任务失败');
    } finally {
      setIsCompleting(false);
    }
  };

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline">待领取</Badge>;
      case 'claimed':
        return <Badge variant="secondary">进行中</Badge>;
      case 'completed':
        return <Badge variant="default">已完成</Badge>;
      case 'expired':
        return <Badge variant="destructive">已过期</Badge>;
      case 'cancelled':
        return <Badge variant="secondary">已取消</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatPaymentMethod = (method: string | null) => {
    if (!method) return '-';
    const methodMap: Record<string, string> = {
      wechat: '微信',
      alipay: '支付宝',
      bank: '银行卡',
      paypal: 'PayPal',
      venmo: 'Venmo',
      cash_app: 'Cash App',
      zelle: 'Zelle',
      stripe: 'Stripe',
      wise: 'Wise',
      payoneer: 'Payoneer',
      swift: 'SWIFT',
    };
    return methodMap[method] || method;
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
        <h1 className="text-xl font-bold text-gray-900">{t('tasks.payout.title')}</h1>

        {/* 提示卡片 */}
        {!canClaim && activeTask && (
          <Card className="p-4 bg-gradient-to-br from-orange-500 to-orange-600 text-white">
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
        <Card className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center gap-3 mb-2">
            <CreditCard className="w-8 h-8" />
            <div>
              <p className="text-sm opacity-90">代付任务</p>
              <p className="text-2xl font-bold">
                {availableTasks.length} 个可领取
              </p>
            </div>
          </div>
          <p className="text-xs opacity-80">
            完成代付任务赚取手续费奖励
          </p>
        </Card>

        {/* 任务 Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="hall">任务大厅</TabsTrigger>
            <TabsTrigger value="claimed">已领取任务</TabsTrigger>
          </TabsList>

          {/* 任务大厅 */}
          <TabsContent value="hall" className="space-y-3 mt-4">
            {loading ? (
              <div className="text-center py-8 text-gray-500">
                加载中...
              </div>
            ) : !canClaim ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 text-orange-500" />
                <p className="text-gray-600 mb-3">您当前有未完成的任务</p>
                <Button onClick={() => setActiveTab('claimed')}>
                  查看已领取任务
                </Button>
              </div>
            ) : availableTasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                暂无可用任务
              </div>
            ) : (
              availableTasks.map((order) => (
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
                          即将过期
                        </Badge>
                      )}
                      {getStatusBadge(order.status)}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div>
                      <p className="text-xs text-gray-600">代付金额</p>
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
                    <div>
                      <p className="text-xs text-gray-600">支付方式</p>
                      <p className="font-medium text-gray-900">
                        {formatPaymentMethod(order.payment_method)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      className="flex-1"
                      onClick={() => setSelectedOrder(order)}
                    >
                      查看详情
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleClaim(order.id)}
                      disabled={isClaiming}
                    >
                      {isClaiming ? '领取中...' : '领取'}
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          {/* 已领取任务 */}
          <TabsContent value="claimed" className="space-y-3 mt-4">
            {loading ? (
              <div className="text-center py-8 text-gray-500">
                加载中...
              </div>
            ) : claimedTasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                暂无已领取的任务
              </div>
            ) : (
              claimedTasks.map((order) => (
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

                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div>
                      <p className="text-xs text-gray-600">代付金额</p>
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
                    <div>
                      <p className="text-xs text-gray-600">状态</p>
                      <p className="font-medium text-gray-900">
                        {order.payment_screenshot_url ? '已上传凭证' : '待上传'}
                      </p>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    onClick={() => setSelectedOrder(order)}
                  >
                    {order.status === 'claimed' && !order.payment_screenshot_url
                      ? '上传支付凭证'
                      : order.status === 'claimed' && order.payment_screenshot_url
                      ? '完成任务'
                      : '查看详情'}
                  </Button>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* 任务详情弹窗 */}
        <TaskDetailDialog
          order={selectedOrder}
          open={!!selectedOrder}
          onOpenChange={(open) => !open && setSelectedOrder(null)}
          onComplete={handleComplete}
          isCompleting={isCompleting}
        />
      </div>
    </MainLayout>
  );
}
