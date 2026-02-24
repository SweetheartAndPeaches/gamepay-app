'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/MainLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useI18n } from '@/i18n/context';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Clock,
  Shield,
  Wallet,
  RefreshCw,
} from 'lucide-react';
import { BalanceRecord, TransactionType } from '@/types/balance';

const TRANSACTION_TYPES: Record<
  TransactionType,
  {
    label: string;
    icon: React.ElementType;
    color: string;
    isIncome: boolean;
  }
> = {
  task_reward: {
    label: 'balanceHistory.taskReward',
    icon: ArrowDownCircle,
    color: 'text-green-600 bg-green-100',
    isIncome: true,
  },
  commission: {
    label: 'balanceHistory.commission',
    icon: ArrowDownCircle,
    color: 'text-green-600 bg-green-100',
    isIncome: true,
  },
  withdrawal: {
    label: 'balanceHistory.withdrawal',
    icon: ArrowUpCircle,
    color: 'text-red-600 bg-red-100',
    isIncome: false,
  },
  deposit: {
    label: 'balanceHistory.deposit',
    icon: ArrowDownCircle,
    color: 'text-green-600 bg-green-100',
    isIncome: true,
  },
  freeze: {
    label: 'balanceHistory.freeze',
    icon: Shield,
    color: 'text-orange-600 bg-orange-100',
    isIncome: false,
  },
  unfreeze: {
    label: 'balanceHistory.unfreeze',
    icon: Shield,
    color: 'text-blue-600 bg-blue-100',
    isIncome: true,
  },
};

type TabType = 'all' | 'income' | 'outcome';

export default function BalanceHistoryPage() {
  const { t, formatCurrency } = useI18n();
  const [records, setRecords] = useState<BalanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [selectedType, setSelectedType] = useState<TransactionType | null>(null);
  const [statistics, setStatistics] = useState({
    totalIncome: 0,
    totalOutcome: 0,
    availableBalance: 0,
    frozenBalance: 0,
  });

  // 获取余额记录
  const fetchRecords = async () => {
    try {
      setLoading(true);
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return;
      }

      // TODO: 实际数据获取逻辑
      // const { data, error } = await supabase
      //   .from('balance_records')
      //   .select('*')
      //   .eq('userId', user.user.id)
      //   .order('createdAt', { ascending: false })
      //   .limit(50);

      // 模拟数据
      const mockRecords: BalanceRecord[] = [
        {
          id: '1',
          userId: user.user.id,
          type: 'task_reward',
          amount: 2.40,
          balanceAfter: 1250.40,
          description: '代付任务奖励 - ORD003',
          relatedOrderId: 'ORD003',
          createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        },
        {
          id: '2',
          userId: user.user.id,
          type: 'commission',
          amount: 15.00,
          balanceAfter: 1248.00,
          description: '代理佣金 - 用户 138****1234',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        },
        {
          id: '3',
          userId: user.user.id,
          type: 'withdrawal',
          amount: -500.00,
          balanceAfter: 1233.00,
          description: '提现申请 - 银行卡',
          relatedOrderId: 'WD001',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        },
        {
          id: '4',
          userId: user.user.id,
          type: 'freeze',
          amount: -200.00,
          balanceAfter: 1733.00,
          description: '任务冻结 - ORD005',
          relatedOrderId: 'ORD005',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
          updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
        },
        {
          id: '5',
          userId: user.user.id,
          type: 'unfreeze',
          amount: 200.00,
          balanceAfter: 1933.00,
          description: '任务解冻 - ORD005',
          relatedOrderId: 'ORD005',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
          updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
        },
      ];

      setRecords(mockRecords);

      // 计算统计数据
      const totalIncome = mockRecords
        .filter((r) => TRANSACTION_TYPES[r.type].isIncome)
        .reduce((sum, r) => sum + r.amount, 0);
      const totalOutcome = mockRecords
        .filter((r) => !TRANSACTION_TYPES[r.type].isIncome)
        .reduce((sum, r) => sum + Math.abs(r.amount), 0);

      setStatistics({
        totalIncome,
        totalOutcome,
        availableBalance: 1250.40,
        frozenBalance: 0,
      });
    } catch (error) {
      console.error('Failed to fetch balance records:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  // 筛选记录
  const filteredRecords = records.filter((record) => {
    const typeInfo = TRANSACTION_TYPES[record.type];

    if (selectedType && record.type !== selectedType) {
      return false;
    }

    if (activeTab === 'income') {
      return typeInfo.isIncome;
    } else if (activeTab === 'outcome') {
      return !typeInfo.isIncome;
    }

    return true;
  });

  // 格式化时间
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return t('common.loading');
    if (minutes < 60) return `${minutes} ${t('common.minAgo')}`;
    if (hours < 24) return `${hours} ${t('common.hoursAgo')}`;
    if (days < 7) return `${days} ${t('common.daysAgo')}`;

    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  return (
    <MainLayout showBalance={false}>
      <div className="flex flex-col h-full">
        {/* 统计卡片 */}
        <div className="p-4 space-y-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {t('balanceHistory.title')}
            </h2>
          </div>

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
            <div className="text-3xl font-bold mb-4">
              {formatCurrency(statistics.availableBalance)}
            </div>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-1">
                <ArrowDownCircle className="w-4 h-4 opacity-75" />
                <span>
                  {t('balanceHistory.totalIncome')}: {formatCurrency(statistics.totalIncome)}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <ArrowUpCircle className="w-4 h-4 opacity-75" />
                <span>
                  {t('balanceHistory.totalOutcome')}: {formatCurrency(statistics.totalOutcome)}
                </span>
              </div>
            </div>
          </Card>

          {/* 筛选标签页 */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">{t('common.all')}</TabsTrigger>
              <TabsTrigger value="income">
                <ArrowDownCircle className="w-4 h-4 mr-1" />
                {t('balanceHistory.income')}
              </TabsTrigger>
              <TabsTrigger value="outcome">
                <ArrowUpCircle className="w-4 h-4 mr-1" />
                {t('balanceHistory.outcome')}
              </TabsTrigger>
            </TabsList>

            {/* 交易类型筛选 */}
            <div className="mt-4">
              <div className="flex gap-2 overflow-x-auto pb-2">
                <Button
                  variant={selectedType === null ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedType(null)}
                >
                  {t('common.all')}
                </Button>
                {Object.entries(TRANSACTION_TYPES).map(([type, info]) => {
                  const Icon = info.icon;
                  return (
                    <Button
                      key={type}
                      variant={selectedType === type ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedType(type as TransactionType)}
                      className="whitespace-nowrap"
                    >
                      <Icon className="w-4 h-4 mr-1" />
                      {t(info.label)}
                    </Button>
                  );
                })}
              </div>
            </div>
          </Tabs>
        </div>

        {/* 记录列表 */}
        <ScrollArea className="flex-1 px-4 pb-4">
          <Card>
            {loading ? (
              <div className="p-4 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <Wallet className="w-12 h-12 mb-2 opacity-50" />
                <p>{t('balanceHistory.noRecords')}</p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredRecords.map((record) => {
                  const typeInfo = TRANSACTION_TYPES[record.type];
                  const Icon = typeInfo.icon;
                  const isPositive = typeInfo.isIncome;

                  return (
                    <div
                      key={record.id}
                      className="p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${typeInfo.color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium text-gray-900 truncate">
                              {t(typeInfo.label)}
                            </h4>
                            <span
                              className={`font-semibold ${
                                isPositive ? 'text-green-600' : 'text-red-600'
                              }`}
                            >
                              {isPositive ? '+' : ''}
                              {formatCurrency(record.amount)}
                            </span>
                          </div>
                          {record.description && (
                            <p className="text-sm text-gray-600 truncate mb-1">
                              {record.description}
                            </p>
                          )}
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{formatTime(record.createdAt)}</span>
                            </div>
                            <span>{t('balanceHistory.balanceAfter')}: {formatCurrency(record.balanceAfter)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </ScrollArea>

        {/* 刷新按钮 */}
        <div className="p-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={fetchRecords}
            disabled={loading}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`}
            />
            {t('common.refresh')}
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
