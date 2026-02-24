'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/MainLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/i18n/context';
import { CreditCard, Clock, CheckCircle } from 'lucide-react';

interface Task {
  id: string;
  orderNo: string;
  amount: string;
  reward: string;
  status: 'pending' | 'claimed' | 'completed';
  expiryTime: string;
}

interface TaskGroup {
  range: string;
  required: number;
  completed: number;
  tasks: Task[];
}

export default function PayoutTasksPage() {
  const { t, formatCurrency, locale } = useI18n();
  
  // 获取所有翻译用于调试
  const allTranslations = {
    payoutTitle: t('tasks.payout.title'),
    payoutTotalTasks: t('tasks.payout.totalTasks'),
    payoutDescription: t('tasks.payout.description'),
    payoutTaskRange: t('tasks.payout.taskRange'),
    payoutProgress: t('tasks.payout.progress', { current: 1, total: 3 }),
    payoutInProgress: t('tasks.payout.inProgress'),
    payoutOrderNo: t('tasks.payout.orderNo'),
    payoutOrderAmount: t('tasks.payout.orderAmount'),
    payoutReward: t('tasks.payout.reward'),
    payoutExpiryTime: t('tasks.payout.expiryTime'),
    payoutClaimTask: t('tasks.payout.claimTask'),
    payoutMarkCompleted: t('tasks.payout.markCompleted'),
    payoutCompleted: t('tasks.payout.completed'),
    statusPending: t('tasks.payout.status.pending'),
    statusClaimed: t('tasks.payout.status.claimed'),
    statusCompleted: t('tasks.payout.status.completed'),
  };

  console.log('PayoutTasksPage - Current locale:', locale);
  console.log('PayoutTasksPage - All translations:', allTranslations);
  
  const [taskGroups, setTaskGroups] = useState<TaskGroup[]>([
    {
      range: '100-500',
      required: 3,
      completed: 1,
      tasks: [
        { id: '1', orderNo: 'ORD001', amount: '200.00', reward: '1.00', status: 'pending', expiryTime: '2024-01-01 12:00:00' },
        { id: '2', orderNo: 'ORD002', amount: '350.00', reward: '1.75', status: 'claimed', expiryTime: '2024-01-01 12:00:00' },
        { id: '3', orderNo: 'ORD003', amount: '480.00', reward: '2.40', status: 'completed', expiryTime: '2024-01-01 12:00:00' },
      ],
    },
    {
      range: '501-1000',
      required: 5,
      completed: 0,
      tasks: [
        { id: '4', orderNo: 'ORD004', amount: '600.00', reward: '3.00', status: 'pending', expiryTime: '2024-01-01 12:00:00' },
        { id: '5', orderNo: 'ORD005', amount: '750.00', reward: '3.75', status: 'pending', expiryTime: '2024-01-01 12:00:00' },
      ],
    },
  ]);

  const handleClaim = (groupId: string, taskId: string) => {
    setTaskGroups((prev) =>
      prev.map((group) => {
        if (group.range !== groupId) return group;

        return {
          ...group,
          tasks: group.tasks.map((task) =>
            task.id === taskId && task.status === 'pending'
              ? { ...task, status: 'claimed' as const }
              : task
          ),
        };
      })
    );
  };

  const handleComplete = (groupId: string, taskId: string) => {
    setTaskGroups((prev) =>
      prev.map((group) => {
        if (group.range !== groupId) return group;

        const updatedTasks = group.tasks.map((task) =>
          task.id === taskId && task.status === 'claimed'
            ? { ...task, status: 'completed' as const }
            : task
        );

        const completed = updatedTasks.filter((t) => t.status === 'completed').length;

        return {
          ...group,
          completed,
          tasks: updatedTasks,
        };
      })
    );
  };

  const getStatusBadge = (status: Task['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline">{t('tasks.payout.status.pending')}</Badge>;
      case 'claimed':
        return <Badge variant="secondary">{t('tasks.payout.status.claimed')}</Badge>;
      case 'completed':
        return <Badge variant="default">{t('tasks.payout.status.completed')}</Badge>;
    }
  };

  return (
    <MainLayout showBalance={false}>
      {/* 调试面板 */}
      <div className="fixed top-0 left-0 right-0 bg-yellow-100 border-b border-yellow-300 p-2 z-50 text-xs overflow-auto max-h-32">
        <strong>调试信息：</strong>
        <div>Locale: {locale}</div>
        <div>Payout Title: {t('tasks.payout.title')}</div>
        <div>Payout Total Tasks: {t('tasks.payout.totalTasks')}</div>
        <div>Status Pending: {t('tasks.payout.status.pending')}</div>
        <div>Task Range: {t('tasks.payout.taskRange')}</div>
      </div>

      <div className="p-4 space-y-4 mt-12">
        <h1 className="text-xl font-bold text-gray-900">{t('tasks.payout.title')}</h1>

        <Card className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center gap-3 mb-2">
            <CreditCard className="w-8 h-8" />
            <div>
              <p className="text-sm opacity-90">{t('tasks.payout.totalTasks')}</p>
              <p className="text-2xl font-bold">
                {taskGroups.reduce((acc, g) => acc + g.required, 0)}
              </p>
            </div>
          </div>
          <p className="text-xs opacity-80">{t('tasks.payout.description')}</p>
        </Card>

        {taskGroups.map((group) => (
          <Card key={group.range} className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="font-semibold text-gray-900">
                  {t('tasks.payout.taskRange')} {formatCurrency(group.range.split('-')[0])} - {formatCurrency(group.range.split('-')[1])}
                </h2>
                <p className="text-sm text-gray-600">
                  {t('tasks.payout.progress', { current: group.completed, total: group.required })}
                </p>
              </div>
              <Badge
                variant={group.completed >= group.required ? 'default' : 'secondary'}
              >
                {group.completed >= group.required ? t('tasks.payout.completed') : t('tasks.payout.inProgress')}
              </Badge>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{
                  width: `${(group.completed / group.required) * 100}%`,
                }}
              />
            </div>

            <div className="space-y-3">
              {group.tasks.map((task) => (
                <Card key={task.id} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {t('tasks.payout.orderNo')}: {task.orderNo}
                      </span>
                    </div>
                    {getStatusBadge(task.status)}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-gray-600">{t('tasks.payout.orderAmount')}</p>
                      <p className="font-bold text-gray-900">{formatCurrency(task.amount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">{t('tasks.payout.reward')}</p>
                      <p className="font-bold text-green-600">
                        {formatCurrency(task.reward)}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 mb-3">
                    {t('tasks.payout.expiryTime')}: {task.expiryTime}
                  </p>

                  {task.status === 'pending' && (
                    <Button
                      className="w-full"
                      onClick={() => handleClaim(group.range, task.id)}
                    >
                      {t('tasks.payout.claimTask')}
                    </Button>
                  )}

                  {task.status === 'claimed' && (
                    <Button
                      className="w-full"
                      variant="secondary"
                      onClick={() => handleComplete(group.range, task.id)}
                    >
                      {t('tasks.payout.markCompleted')}
                    </Button>
                  )}

                  {task.status === 'completed' && (
                    <div className="flex items-center justify-center gap-2 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">{t('payout.completed')}</span>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </MainLayout>
  );
}
