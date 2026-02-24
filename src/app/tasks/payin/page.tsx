'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/MainLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/i18n/context';
import { Wallet, Clock, CheckCircle } from 'lucide-react';

interface Task {
  id: string;
  amount: string;
  rate: number;
  reward: string;
  status: 'pending' | 'completed' | 'expired';
  expiryTime: string;
}

export default function PayinTasksPage() {
  const { t, formatCurrency } = useI18n();
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      amount: '1000.00',
      rate: 0.5,
      reward: '5.00',
      status: 'pending',
      expiryTime: '2024-01-01 12:00:00',
    },
    {
      id: '2',
      amount: '2000.00',
      rate: 0.6,
      reward: '12.00',
      status: 'completed',
      expiryTime: '2024-01-01 12:00:00',
    },
    {
      id: '3',
      amount: '500.00',
      rate: 0.4,
      reward: '2.00',
      status: 'expired',
      expiryTime: '2024-01-01 12:00:00',
    },
  ]);

  const handleComplete = (taskId: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId && task.status === 'pending'
          ? { ...task, status: 'completed' as const }
          : task
      )
    );
  };

  const getStatusBadge = (status: Task['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline">{t('payin.status.pending')}</Badge>;
      case 'completed':
        return <Badge variant="default">{t('payin.status.completed')}</Badge>;
      case 'expired':
        return <Badge variant="destructive">{t('payin.status.expired')}</Badge>;
    }
  };

  return (
    <MainLayout showBalance={false}>
      <div className="p-4 space-y-4">
        <h1 className="text-xl font-bold text-gray-900">{t('payin.title')}</h1>

        <Card className="p-4 bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center gap-3 mb-2">
            <Wallet className="w-8 h-8" />
            <div>
              <p className="text-sm opacity-90">{t('payin.totalTasks')}</p>
              <p className="text-2xl font-bold">
                {tasks.filter((t) => t.status !== 'expired').length}
              </p>
            </div>
          </div>
          <p className="text-xs opacity-80">{t('payin.description')}</p>
        </Card>

        <div className="space-y-3">
          {tasks.map((task) => (
            <Card key={task.id} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {t('payin.expiryTime')}: {task.expiryTime}
                  </span>
                </div>
                {getStatusBadge(task.status)}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <p className="text-xs text-gray-600">{t('payin.amount')}</p>
                  <p className="font-bold text-gray-900">{formatCurrency(task.amount)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">{t('payin.rate')}</p>
                  <p className="font-bold text-gray-900">{(task.rate * 100).toFixed(1)}%</p>
                </div>
              </div>

              <div className="mb-3">
                <p className="text-xs text-gray-600">{t('payin.reward')}</p>
                <p className="font-bold text-green-600">{formatCurrency(task.reward)}</p>
              </div>

              {task.status === 'pending' && (
                <Button
                  className="w-full"
                  onClick={() => handleComplete(task.id)}
                >
                  {t('payin.completeTask')}
                </Button>
              )}

              {task.status === 'completed' && (
                <div className="flex items-center justify-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">{t('payin.status.completed')}</span>
                </div>
              )}

              {task.status === 'expired' && (
                <div className="text-center text-sm text-gray-500">
                  {t('payin.taskExpired')}
                </div>
              )}
            </Card>
          ))}

          {tasks.length === 0 && (
            <Card className="p-6 text-center text-gray-500 text-sm">
              {t('payin.noTasks')}
            </Card>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
