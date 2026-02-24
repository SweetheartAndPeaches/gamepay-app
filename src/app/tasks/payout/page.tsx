'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/MainLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

  const handleClaimTask = async (taskId: string) => {
    // TODO: 实现领取任务逻辑
    console.log('Claim task:', taskId);
  };

  return (
    <MainLayout>
      <div className="p-4 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">代付任务</h2>
          <p className="text-sm text-gray-600">
            完成每日最低任务次数后方可进行代收任务
          </p>
        </div>

        {taskGroups.map((group) => {
          const isCompleted = group.completed >= group.required;
          const progress = (group.completed / group.required) * 100;

          return (
            <Card key={group.range} className="p-4">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {group.range} 元
                  </h3>
                  <p className="text-sm text-gray-600">
                    今日需完成 {group.required} 单，已完成 {group.completed} 单
                  </p>
                </div>
                {isCompleted && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    已达标
                  </Badge>
                )}
              </div>

              {/* 进度条 */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>

              {/* 任务列表 */}
              <div className="space-y-3">
                {group.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {task.orderNo}
                        </span>
                        <Badge
                          variant={
                            task.status === 'completed'
                              ? 'secondary'
                              : task.status === 'claimed'
                              ? 'outline'
                              : 'default'
                          }
                        >
                          {task.status === 'completed'
                            ? '已完成'
                            : task.status === 'claimed'
                            ? '已领取'
                            : '待领取'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <span>金额: {task.amount} 元</span>
                        <span>奖励: {task.reward} 元</span>
                      </div>
                    </div>

                    {task.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => handleClaimTask(task.id)}
                      >
                        领取
                      </Button>
                    )}
                  </div>
                ))}

                {group.tasks.length === 0 && (
                  <div className="text-center py-6 text-gray-500 text-sm">
                    暂无可用任务
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </MainLayout>
  );
}
