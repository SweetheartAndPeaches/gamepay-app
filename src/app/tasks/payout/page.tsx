'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/MainLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useI18n } from '@/i18n/context';
import { useAuth } from '@/contexts/AuthContext';
import { authFetch } from '@/lib/auth';
import { Wallet, Clock, AlertCircle, ArrowDownCircle, ArrowUpCircle, Shield, Filter } from 'lucide-react';
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

// 金额范围选项
const AMOUNT_RANGES = [
  { value: 'all', label: 'common.all', min: 0, max: Infinity },
  { value: '100-500', label: 'tasks.payout.amountRange.100_500', min: 100, max: 500 },
  { value: '501-1000', label: 'tasks.payout.amountRange.501_1000', min: 501, max: 1000 },
  { value: '1001-2000', label: 'tasks.payout.amountRange.1001_2000', min: 1001, max: 2000 },
  { value: '2001-5000', label: 'tasks.payout.amountRange.2001_5000', min: 2001, max: 5000 },
];

export default function PayoutTasksPage() {
  const { t, formatCurrency } = useI18n();
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('hall');
  const [availableTasks, setAvailableTasks] = useState<Order[]>([]);
  const [claimedTasks, setClaimedTasks] = useState<Order[]>([]);
  const [activeTask, setActiveTask] = useState<Order | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [canClaim, setCanClaim] = useState(true);
  const [selectedAmountRange, setSelectedAmountRange] = useState('all');
  const [balanceStats, setBalanceStats] = useState({
    totalIncome: 0,
    totalOutcome: 0,
  });

  // 分页状态
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const limit = 10;
  
  // 使用 ref 避免重复加载请求和存储当前 offset
  const isLoadingRef = useRef(false);
  const loadingRef = useRef(loading);
  const loadingMoreRef = useRef(loadingMore);
  const offsetRef = useRef(offset);
  const loadedOrderIdsRef = useRef<Set<string>>(new Set());
  const selectedAmountRangeRef = useRef(selectedAmountRange);
  
  // 同步 loading 状态到 ref
  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  // 同步 loadingMore 状态到 ref
  useEffect(() => {
    loadingMoreRef.current = loadingMore;
  }, [loadingMore]);
  
  // 同步 offset 到 ref
  useEffect(() => {
    offsetRef.current = offset;
  }, [offset]);

  // 同步 selectedAmountRange 到 ref
  useEffect(() => {
    selectedAmountRangeRef.current = selectedAmountRange;
  }, [selectedAmountRange]);

  // 统计数据
  const statistics = {
    availableBalance: user?.balance || 0,
    frozenBalance: user?.frozenBalance || 0,
    totalIncome: balanceStats.totalIncome,
    totalOutcome: balanceStats.totalOutcome,
  };

  // 格式化统计数据的金额
  const formatStatsCurrency = (value: number) => formatCurrency(value.toString());

  // 检查登录状态
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
      return;
    }
  }, [isAuthenticated, router]);

  // 获取可领取任务列表
  const fetchAvailableTasks = async (loadMore = false) => {
    try {
      // 防止重复请求
      if (isLoadingRef.current) return;
      isLoadingRef.current = true;

      // 保存请求时的金额范围，用于后续验证
      const requestAmountRange = selectedAmountRangeRef.current;

      if (!loadMore) {
        setLoading(true);
        setOffset(0);
        // 重置已加载的订单 ID ref
        loadedOrderIdsRef.current = new Set();
      } else {
        setLoadingMore(true);
      }

      // 获取当前选中的金额范围（使用 ref 确保总是最新的值）
      const amountRange = AMOUNT_RANGES.find(range => range.value === selectedAmountRangeRef.current);
      const minAmount = amountRange?.min ?? 0;
      const maxAmount = amountRange?.max ?? Infinity;

      // 构建 URL 参数，如果 maxAmount 是 Infinity，则不传这个参数
      const maxAmountParam = maxAmount === Infinity ? '' : `&maxAmount=${maxAmount}`;
      
      const response = await authFetch(
        `/api/tasks/payout/available?offset=${loadMore ? offsetRef.current : offset}&limit=${limit}&minAmount=${minAmount}${maxAmountParam}`
      );
      const data: ApiResponse = await response.json();

      // 验证金额范围是否仍然匹配（防止在切换金额范围时追加旧数据）
      if (requestAmountRange !== selectedAmountRangeRef.current) {
        console.log('[Fetch Available Tasks] Amount range changed, discarding results', {
          requestAmountRange,
          currentAmountRange: selectedAmountRangeRef.current,
        });
        return;
      }

      console.log('[Fetch Available Tasks]', {
        loadMore,
        offset: loadMore ? offsetRef.current : offset,
        limit,
        minAmount,
        maxAmount,
        selectedAmountRange: selectedAmountRangeRef.current,
        success: data.success,
        canClaim: data.data?.canClaim,
        tasksCount: data.data?.tasks?.length,
        taskAmounts: data.data?.tasks?.map((t: Order) => t.amount),
        hasMore: data.data?.hasMore,
      });

      if (data.success) {
        setCanClaim(data.data.canClaim);

        if (loadMore) {
          // 加载更多：追加数据，但过滤掉重复的订单
          const newTasks = (data.data.tasks || []).filter((task: Order) => 
            !loadedOrderIdsRef.current.has(task.id)
          );
          
          // 更新已加载的订单 ID 集合 ref
          newTasks.forEach((task: Order) => loadedOrderIdsRef.current.add(task.id));
          
          // 只追加新的订单
          setAvailableTasks(prev => [...prev, ...newTasks]);
        } else {
          // 首次加载：替换数据
          const tasks = data.data.tasks || [];
          // 更新已加载的订单 ID 集合 ref
          loadedOrderIdsRef.current = new Set(tasks.map((t: Order) => t.id));
          setAvailableTasks(tasks);
        }

        setHasMore(data.data.hasMore || false);

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
      isLoadingRef.current = false;
      if (!loadMore) {
        setLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  };

  // 滚动监听 - 实现无限滚动
  const handleScroll = useCallback(() => {
    // 只在任务大厅标签页中启用无限滚动
    if (activeTab !== 'hall' || !canClaim || !hasMore || isLoadingRef.current) {
      return;
    }

    // 检查是否正在加载（通过 ref 检查 loading 和 loadingMore 状态）
    if (loadingRef.current || loadingMoreRef.current) {
      return;
    }

    const scrollPosition = window.innerHeight + window.scrollY;
    const pageHeight = document.documentElement.scrollHeight;

    // 当滚动到距离底部 200px 时加载更多
    if (scrollPosition >= pageHeight - 200) {
      console.log('[Infinite Scroll] Triggered load more', {
        offset: offsetRef.current,
        hasMore,
        isLoading: isLoadingRef.current,
        loading: loadingRef.current,
        loadingMore: loadingMoreRef.current,
      });
      
      const newOffset = offsetRef.current + limit;
      offsetRef.current = newOffset;
      setOffset(newOffset);
      fetchAvailableTasks(true);
    }
  }, [activeTab, canClaim, hasMore, limit]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);
  const fetchClaimedTasks = async () => {
    try {
      setLoading(true);
      const response = await authFetch('/api/tasks/payout/claimed');
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

  // 获取余额统计数据
  const fetchBalanceStatistics = async () => {
    try {
      const response = await authFetch('/api/balance/statistics');
      const data: ApiResponse = await response.json();

      if (data.success) {
        setBalanceStats(data.data);
      }
    } catch (error) {
      console.error('Fetch balance statistics error:', error);
    }
  };

  // 领取任务
  const handleClaim = async (orderId: string) => {
    try {
      setIsClaiming(true);
      const response = await authFetch('/api/tasks/payout/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId }),
      });

      const data: ApiResponse = await response.json();

      if (data.success) {
        toast.success('领取任务成功');
        // 设置有未完成任务
        setCanClaim(false);
        // 设置当前任务
        setActiveTask(data.data);
        // 先刷新已领取任务列表
        await fetchClaimedTasks();
        // 再切换到已领取标签页
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

  const formatPaymentMethod = (method: string | null) => {
    if (!method) return '-';
    return t(`tasks.payout.paymentMethods.${method}`);
  };

  const isExpiringSoon = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    return diff > 0 && diff < 5 * 60 * 1000; // 5 分钟内
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchAvailableTasks();
      fetchBalanceStatistics();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (activeTab === 'claimed' && isAuthenticated) {
      fetchClaimedTasks();
    }
  }, [activeTab, isAuthenticated]);

  // 切换到任务大厅时重新检查任务状态
  useEffect(() => {
    if (activeTab === 'hall' && isAuthenticated) {
      fetchAvailableTasks();
    }
  }, [activeTab]);

  // 金额范围改变时重新加载任务列表
  useEffect(() => {
    if (isAuthenticated && activeTab === 'hall') {
      // 重置 offset 和任务列表
      setOffset(0);
      setAvailableTasks([]);
      loadedOrderIdsRef.current = new Set();
      // 重新加载任务列表
      fetchAvailableTasks(false);
    }
  }, [selectedAmountRange]);

  if (!isAuthenticated) {
    return null;
  }

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
                <p className="font-semibold">{t('tasks.payout.youHaveUnfinishedTask')}</p>
                <p className="text-sm opacity-90">{t('tasks.payout.pleaseCompleteFirst')}</p>
              </div>
            </div>
          </Card>
        )}

        {/* 余额卡片 */}
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

        {/* 任务 Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="hall">{t('tasks.payout.hall')}</TabsTrigger>
            <TabsTrigger value="claimed">{t('tasks.payout.claimedTasks')}</TabsTrigger>
          </TabsList>

          {/* 任务大厅 */}
          <TabsContent value="hall" className="space-y-3 mt-4">
            {/* 金额范围选择器 */}
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-4 h-4 text-gray-600" />
              <Select value={selectedAmountRange} onValueChange={setSelectedAmountRange}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder={t('tasks.payout.amountRange.placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  {AMOUNT_RANGES.map((range) => (
                    <SelectItem key={range.value} value={range.value}>
                      {t(range.label)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="text-center py-8 text-gray-500">
                {t('common.loading')}
              </div>
            ) : !canClaim ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 text-orange-500" />
                <p className="text-gray-600 mb-3">{t('tasks.payout.youHaveUnfinishedTask')}</p>
                <Button onClick={() => setActiveTab('claimed')}>
                  {t('tasks.payout.viewClaimedTasks')}
                </Button>
              </div>
            ) : availableTasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {t('tasks.payout.noTasks')}
              </div>
            ) : (
              <>
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
                            {t('tasks.payout.expiringSoon')}
                          </Badge>
                        )}
                        {getStatusBadge(order.status)}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <div>
                        <p className="text-xs text-gray-600">{t('tasks.payout.orderAmount')}</p>
                        <p className="font-bold text-gray-900">
                          {formatCurrency(order.amount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">{t('tasks.payout.reward')}</p>
                        <p className="font-bold text-green-600">
                          +{formatCurrency(order.commission)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">{t('tasks.payout.paymentMethod')}</p>
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
                        {t('tasks.payout.viewDetails')}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleClaim(order.id)}
                        disabled={isClaiming}
                      >
                        {isClaiming ? t('tasks.payout.submitting') : t('tasks.payout.claim')}
                      </Button>
                    </div>
                  </Card>
                ))}

                {/* 加载更多指示器 */}
                {loadingMore && (
                  <div className="text-center py-4 text-gray-500">
                    {t('common.loading')}
                  </div>
                )}

                {/* 没有更多数据提示 */}
                {!hasMore && availableTasks.length > 0 && (
                  <div className="text-center py-4 text-gray-400 text-sm">
                    {t('common.noMoreData')}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* 已领取任务 */}
          <TabsContent value="claimed" className="space-y-3 mt-4">
            {loading ? (
              <div className="text-center py-8 text-gray-500">
                {t('common.loading')}
              </div>
            ) : claimedTasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="mb-4">{t('tasks.payout.noClaimedTasks')}</p>
                <Button onClick={() => setActiveTab('hall')}>
                  {t('tasks.payout.goToHall')}
                </Button>
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
                      <p className="text-xs text-gray-600">{t('tasks.payout.orderAmount')}</p>
                      <p className="font-bold text-gray-900">
                        {formatCurrency(order.amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">{t('tasks.payout.reward')}</p>
                      <p className="font-bold text-green-600">
                        +{formatCurrency(order.commission)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">{t('tasks.payout.paymentMethod')}</p>
                      <p className="font-medium text-gray-900">
                        {formatPaymentMethod(order.payment_method)}
                      </p>
                    </div>
                  </div>

                  <div className="text-sm text-gray-600 mb-3">
                    <p>{t('tasks.payout.receiverAccount')}: {order.payment_account}</p>
                  </div>

                  <Button
                    className="w-full"
                    onClick={() => setSelectedOrder(order)}
                  >
                    {t('tasks.payout.viewDetailsContinue')}
                  </Button>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* 任务详情对话框 */}
        {selectedOrder && (
          <TaskDetailDialog
            order={selectedOrder}
            open={!!selectedOrder}
            onOpenChange={(open) => {
              if (!open) {
                setSelectedOrder(null);
              }
            }}
            onComplete={async (orderId, screenshotUrl) => {
              try {
                setIsClaiming(true);

                // 检查是否已有支付凭证
                if (selectedOrder.payment_screenshot_url) {
                  // 已有凭证，调用完成任务 API
                  const response = await authFetch('/api/tasks/payout/complete', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ orderId }),
                  });

                  const data: ApiResponse = await response.json();

                  if (data.success) {
                    toast.success(`任务完成！订单金额 ${formatCurrency(data.data.orderAmount)} + 奖励 ${formatCurrency(data.data.commission)} = 总计 ${formatCurrency(data.data.totalReward)}`);
                    // 刷新余额统计
                    fetchBalanceStatistics();
                  } else {
                    toast.error(data.message || '完成任务失败');
                  }
                } else {
                  // 没有凭证，调用上传凭证 API
                  if (!screenshotUrl) {
                    toast.error('请先上传支付凭证');
                    return;
                  }

                  const response = await authFetch('/api/tasks/payout/upload-proof', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      orderId,
                      screenshotUrl,
                    }),
                  });

                  const data: ApiResponse = await response.json();

                  if (data.success) {
                    toast.success('支付凭证上传成功，等待审核');
                    // 刷新已领取任务列表
                    await fetchClaimedTasks();
                    // 重新设置选中订单以更新状态
                    const updatedOrder = data.data;
                    setSelectedOrder(updatedOrder);
                  } else {
                    toast.error(data.message || '上传支付凭证失败');
                  }
                }
              } catch (error) {
                console.error('操作失败:', error);
                toast.error('操作失败，请稍后重试');
              } finally {
                setIsClaiming(false);
              }
            }}
            isCompleting={isClaiming}
          />
        )}
      </div>
    </MainLayout>
  );
}
