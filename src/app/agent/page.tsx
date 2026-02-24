'use client';

import { useState } from 'react';
import MainLayout from '@/components/MainLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  TrendingUp,
  Link as LinkIcon,
  Share2,
  DollarSign,
} from 'lucide-react';

interface SubUser {
  id: string;
  phone: string;
  registeredAt: string;
  taskCount: number;
}

interface Commission {
  id: string;
  amount: string;
  type: 'payout' | 'payin';
  fromUser: string;
  createdAt: string;
}

export default function AgentPage() {
  const [agentData] = useState({
    isActive: true,
    totalReferrals: 15,
    totalCommission: '150.00',
    todayCommission: '5.50',
  });

  const [subUsers] = useState<SubUser[]>([
    { id: '1', phone: '139****1234', registeredAt: '2024-01-01', taskCount: 25 },
    { id: '2', phone: '138****5678', registeredAt: '2024-01-02', taskCount: 18 },
    { id: '3', phone: '137****9012', registeredAt: '2024-01-03', taskCount: 32 },
  ]);

  const [commissions] = useState<Commission[]>([
    { id: '1', amount: '0.50', type: 'payout', fromUser: '139****1234', createdAt: '2024-01-01' },
    { id: '2', amount: '0.30', type: 'payin', fromUser: '138****5678', createdAt: '2024-01-01' },
    { id: '3', amount: '0.45', type: 'payout', fromUser: '137****9012', createdAt: '2024-01-01' },
  ]);

  const handleCopyLink = () => {
    // TODO: 实现复制推广链接
    console.log('Copy referral link');
  };

  const handleShare = () => {
    // TODO: 实现分享功能
    console.log('Share');
  };

  return (
    <MainLayout showBalance={false}>
      <div className="p-4 space-y-4">
        {/* 代理状态卡片 */}
        <Card className="p-6">
          {agentData.isActive ? (
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">代理已激活</h2>
                <p className="text-sm text-gray-600">享受佣金收益</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h2 className="text-lg font-bold text-gray-900 mb-1">
                代理未激活
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                推荐满 5 人即可成为代理
              </p>
              <Button variant="outline">去推广</Button>
            </div>
          )}

          {agentData.isActive && (
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {agentData.totalReferrals}
                </p>
                <p className="text-sm text-gray-600">下级人数</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {agentData.todayCommission}
                </p>
                <p className="text-sm text-gray-600">今日佣金</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {agentData.totalCommission}
                </p>
                <p className="text-sm text-gray-600">累计佣金</p>
              </div>
            </div>
          )}
        </Card>

        {/* 推广链接和二维码 */}
        {agentData.isActive && (
          <Card className="p-4">
            <h3 className="font-semibold text-gray-900 mb-3">推广方式</h3>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="flex flex-col items-center gap-2 h-auto py-4"
                onClick={handleCopyLink}
              >
                <LinkIcon className="w-6 h-6" />
                <span className="text-sm">复制链接</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center gap-2 h-auto py-4"
                onClick={handleShare}
              >
                <Share2 className="w-6 h-6" />
                <span className="text-sm">分享二维码</span>
              </Button>
            </div>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="users">下级用户</TabsTrigger>
            <TabsTrigger value="commissions">佣金明细</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-3 mt-4">
            {subUsers.map((user) => (
              <Card key={user.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{user.phone}</p>
                    <p className="text-sm text-gray-600">
                      注册时间：{user.registeredAt}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{user.taskCount}</p>
                    <p className="text-sm text-gray-600">完成任务</p>
                  </div>
                </div>
              </Card>
            ))}

            {subUsers.length === 0 && (
              <Card className="p-6 text-center text-gray-500 text-sm">
                暂无下级用户
              </Card>
            )}
          </TabsContent>

          <TabsContent value="commissions" className="space-y-3 mt-4">
            {commissions.map((commission) => (
              <Card key={commission.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {commission.amount} 元
                      </p>
                      <p className="text-sm text-gray-600">
                        来自：{commission.fromUser}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={
                        commission.type === 'payout' ? 'default' : 'secondary'
                      }
                    >
                      {commission.type === 'payout' ? '代付' : '代收'}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">
                      {commission.createdAt}
                    </p>
                  </div>
                </div>
              </Card>
            ))}

            {commissions.length === 0 && (
              <Card className="p-6 text-center text-gray-500 text-sm">
                暂无佣金记录
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
