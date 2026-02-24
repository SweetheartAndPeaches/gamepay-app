'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/MainLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useI18n } from '@/i18n/context';
import { CreditCard, Clock, CheckCircle, AlertCircle, Wallet, Settings, RefreshCw } from 'lucide-react';
import PayinTaskDetailDialog from '@/components/PayinTaskDetailDialog';
import { toast } from 'sonner';

interface Order {
  id: string;
  order_no: string;
  amount: number;
  commission: number;
  status: 'claimed' | 'completed' | 'expired' | 'cancelled';
  expires_at: string;
  created_at: string;
  payment_method: string | null;
  payment_account: string | null;
}

interface Account {
  id: string;
  type: string;
  account_name: string;
  account_number: string;
  bank_name: string | null;
}

interface UserSettings {
  enabled: boolean;
  max_amount: number;
  daily_limit: number;
  auto_accept: boolean;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data?: any;
}

export default function PayinTasksPage() {
  const { t, formatCurrency } = useI18n();
  const router = useRouter();

  const [tasks, setTasks] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userBalance, setUserBalance] = useState(0);
  const [enabled, setEnabled] = useState(true);
  const [userEnabled, setUserEnabled] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [userSettings, setUserSettings] = useState<UserSettings>({
    enabled: false,
    max_amount: 0,
    daily_limit: 0,
    auto_accept: false,
  });

  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    enabled: false,
    maxAmount: 0,
    dailyLimit: 0,
    autoAccept: false,
  });

  // 获取 token
  const getToken = () => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('token') || '';
  };

  // 获取已分配的任务
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) return;

      const response = await fetch('/api/tasks/payin/assigned', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data: ApiResponse = await response.json();

      if (data.success) {
        setEnabled(data.data.enabled);
        setUserEnabled(data.data.userEnabled);
        setUserBalance(data.data.userBalance || 0);
        setTasks(data.data.tasks || []);
        setAccounts(data.data.accounts || []);
        setUserSettings(data.data.userSettings || {
          enabled: false,
          max_amount: 0,
          daily_limit: 0,
          auto_accept: false,
        });
        setSettingsForm({
          enabled: data.data.userSettings?.enabled || false,
          maxAmount: data.data.userSettings?.max_amount || 0,
          dailyLimit: data.data.userSettings?.daily_limit || 0,
          autoAccept: data.data.userSettings?.auto_accept || false,
        });
      } else {
        toast.error(data.message || '获取任务列表失败');
      }
    } catch (error) {
      console.error('Fetch tasks error:', error);
      toast.error('获取任务列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 更新代收设置
  const handleUpdateSettings = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await fetch('/api/user/payin-settings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enabled: settingsForm.enabled,
          maxAmount: settingsForm.maxAmount,
          dailyLimit: settingsForm.dailyLimit,
          autoAccept: settingsForm.autoAccept,
        }),
      });

      const data: ApiResponse = await response.json();

      if (data.success) {
        toast.success('设置保存成功');
        setSettingsDialogOpen(false);
        await fetchTasks();
      } else {
        toast.error(data.message || '保存设置失败');
      }
    } catch (error) {
      console.error('Update settings error:', error);
      toast.error('保存设置失败');
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
        await fetchTasks();
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

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
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

  const formatPaymentMethod = (type: string) => {
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
    return methodMap[type] || type;
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  return (
    <MainLayout showBalance={false}>
      <div className="p-4 space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">{t('tasks.payin.title')}</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSettingsDialogOpen(true)}
          >
            <Settings className="w-4 h-4 mr-2" />
            代收设置
          </Button>
        </div>

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

        {/* 需要开启代收功能 */}
        {enabled && !userEnabled && (
          <Card className="p-4 bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <div className="flex items-center gap-3">
              <Settings className="w-6 h-6" />
              <div className="flex-1">
                <p className="font-semibold">代收功能未开启</p>
                <p className="text-sm opacity-90">开启代收功能后，系统会自动分配任务</p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSettingsDialogOpen(true)}
              >
                去开启
              </Button>
            </div>
          </Card>
        )}

        {/* 需要添加代收账户 */}
        {enabled && userEnabled && accounts.length === 0 && (
          <Card className="p-4 bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6" />
              <div className="flex-1">
                <p className="font-semibold">请先设置代收账户</p>
                <p className="text-sm opacity-90">系统需要知道使用哪个账户接收款项</p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => router.push('/profile/accounts')}
              >
                添加账户
              </Button>
            </div>
          </Card>
        )}

        {/* 用户余额 */}
        {enabled && userEnabled && (
          <Card className="p-4 bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Wallet className="w-8 h-8" />
                <div>
                  <p className="text-sm opacity-90">您的可用余额</p>
                  <p className="text-2xl font-bold">{formatCurrency(userBalance)}</p>
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fetchTasks()}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                刷新
              </Button>
            </div>
            <p className="text-xs opacity-80 mt-2">
              系统会根据您的设置自动分配代收任务
            </p>
          </Card>
        )}

        {/* 代收设置提示 */}
        {enabled && userEnabled && accounts.length > 0 && (
          <Card className="p-4 bg-blue-50">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Settings className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">当前设置</span>
                </div>
                <p className="text-xs text-blue-700">
                  单次最高金额：{formatCurrency(userSettings.max_amount || 0)}
                  {' · '}
                  每日限制：{userSettings.daily_limit || 0} 单
                  {' · '}
                  自动接受：{userSettings.auto_accept ? '开启' : '关闭'}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSettingsDialogOpen(true)}
              >
                修改
              </Button>
            </div>
          </Card>
        )}

        {/* 任务列表 */}
        {enabled && userEnabled && accounts.length > 0 && (
          <>
            {loading ? (
              <div className="text-center py-8 text-gray-500">
                加载中...
              </div>
            ) : tasks.length === 0 ? (
              <Card className="p-8 text-center">
                <RefreshCw className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-gray-600 mb-2">暂无已分配的任务</p>
                <p className="text-sm text-gray-500">
                  系统会根据您的设置自动分配代收任务，请稍候...
                </p>
              </Card>
            ) : (
              tasks.map((order) => (
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
                    <div>
                      <p className="text-xs text-gray-600">代收账户</p>
                      <p className="font-medium text-gray-900">
                        {formatPaymentMethod(order.payment_method || '')}
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
              ))
            )}
          </>
        )}

        {/* 任务详情弹窗 */}
        <PayinTaskDetailDialog
          order={selectedOrder}
          open={!!selectedOrder}
          onOpenChange={(open) => !open && setSelectedOrder(null)}
          onConfirm={handleConfirm}
          isConfirming={isConfirming}
          userBalance={userBalance}
          enabled={enabled}
        />

        {/* 代收设置弹窗 */}
        <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle>代收设置</DialogTitle>
                <Button variant="link" className="h-auto p-0" asChild>
                  <a href="/tasks/payin/settings" target="_blank">
                    高级设置 →
                  </a>
                </Button>
              </div>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="enabled">开启代收功能</Label>
                <Switch
                  id="enabled"
                  checked={settingsForm.enabled}
                  onCheckedChange={(checked) =>
                    setSettingsForm({ ...settingsForm, enabled: checked })
                  }
                />
              </div>

              {settingsForm.enabled && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="maxAmount">单次最高金额</Label>
                    <Input
                      id="maxAmount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={settingsForm.maxAmount}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          maxAmount: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="0 表示不限制"
                    />
                    <p className="text-xs text-gray-500">
                      0 表示不限制金额
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dailyLimit">每日限制单数</Label>
                    <Input
                      id="dailyLimit"
                      type="number"
                      min="0"
                      value={settingsForm.dailyLimit}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          dailyLimit: parseInt(e.target.value) || 0,
                        })
                      }
                      placeholder="0 表示不限制"
                    />
                    <p className="text-xs text-gray-500">
                      0 表示不限制单数
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="autoAccept">自动接受任务</Label>
                    <Switch
                      id="autoAccept"
                      checked={settingsForm.autoAccept}
                      onCheckedChange={(checked) =>
                        setSettingsForm({ ...settingsForm, autoAccept: checked })
                      }
                    />
                  </div>
                </>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setSettingsDialogOpen(false)}
              >
                取消
              </Button>
              <Button onClick={handleUpdateSettings}>
                保存设置
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
