'use client';

import { useState } from 'react';
import MainLayout from '@/components/MainLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface SubTask {
  id: string;
  subOrderNo: string;
  amount: string;
  status: 'pending' | 'claimed' | 'confirmed';
}

export default function PayinTasksPage() {
  const [hasCompletedDailyTasks, setHasCompletedDailyTasks] = useState(true); // TODO: 从实际状态获取
  const [tasks, setTasks] = useState<SubTask[]>([
    { id: '1', subOrderNo: 'SUB001', amount: '100.01', status: 'pending' },
    { id: '2', subOrderNo: 'SUB002', amount: '100.02', status: 'confirmed' },
    { id: '3', subOrderNo: 'SUB003', amount: '100.03', status: 'pending' },
  ]);

  const handleClaimTask = (taskId: string) => {
    // TODO: 实现领取任务逻辑
    console.log('Claim payin task:', taskId);
  };

  const handleConfirmReceived = (taskId: string) => {
    // TODO: 实现确认收款逻辑
    console.log('Confirm received:', taskId);
  };

  if (!hasCompletedDailyTasks) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
          <AlertCircle className="w-16 h-16 text-yellow-500 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            请先完成今日代付任务
          </h2>
          <p className="text-sm text-gray-600 text-center mb-6">
            完成各金额区间的最低任务次数后方可进行代收任务
          </p>
          <Button asChild>
            <a href="/tasks/payout">前往代付任务</a>
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-4 space-y-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">代收任务</h2>
          <p className="text-sm text-gray-600">
            领取任务后，请在 1-3 分钟内确认收款
          </p>
        </div>

        {/* 提示信息 */}
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-yellow-900 mb-1">注意事项</h3>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• 领取后请立即展示收款码</li>
                <li>• 收到款项后及时确认</li>
                <li>• 超时未确认将影响账号信誉</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* 任务列表 */}
        <div className="space-y-3">
          {tasks.map((task) => (
            <Card key={task.id} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm text-gray-600">订单号</p>
                  <p className="font-mono text-sm font-medium">{task.subOrderNo}</p>
                </div>
                <Badge
                  variant={
                    task.status === 'confirmed'
                      ? 'secondary'
                      : task.status === 'claimed'
                      ? 'outline'
                      : 'default'
                  }
                >
                  {task.status === 'confirmed'
                    ? '已确认'
                    : task.status === 'claimed'
                    ? '已领取'
                    : '待领取'}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">收款金额</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {task.amount} 元
                  </p>
                </div>

                {task.status === 'pending' && (
                  <Button onClick={() => handleClaimTask(task.id)}>
                    领取任务
                  </Button>
                )}

                {task.status === 'claimed' && (
                  <Button
                    variant="default"
                    className="flex items-center gap-2"
                    onClick={() => handleConfirmReceived(task.id)}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    确认收款
                  </Button>
                )}

                {task.status === 'confirmed' && (
                  <Button variant="outline" disabled>
                    已完成
                  </Button>
                )}
              </div>
            </Card>
          ))}

          {tasks.length === 0 && (
            <Card className="p-6 text-center text-gray-500 text-sm">
              暂无可用任务
            </Card>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
