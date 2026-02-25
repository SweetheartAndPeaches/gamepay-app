'use client';

import { useState } from 'react';
import MainLayout from '@/components/MainLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ShareDialog from '@/components/ShareDialog';
import { useI18n } from '@/i18n/context';
import { useAuth } from '@/contexts/AuthContext';
import {
  Users,
  TrendingUp,
  Link as LinkIcon,
  Share2,
  DollarSign,
  Gift,
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
  const { t, formatCurrency } = useI18n();
  const { user } = useAuth();
  const [shareOpen, setShareOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  const [agentData] = useState({
    isActive: true,
    totalReferrals: 15,
    totalCommission: '150.00',
    todayCommission: '5.50',
    inviteCode: 'AGENT12345',
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

  const handleCopyLink = async () => {
    // 生成推广链接并复制
    const inviteUrl = `${window.location.origin}?inviteCode=${agentData.inviteCode}&type=agent`;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      alert(t('agent.linkCopied'));
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const handleShare = () => {
    // 打开分享对话框，使用用户邀请码
    if (!user) return;
    const inviteUrl = `${window.location.origin}?inviteCode=${user.inviteCode}`;
    setShareUrl(inviteUrl);
    setShareOpen(true);
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
                <h2 className="text-lg font-bold text-gray-900">{t('agent.activated')}</h2>
                <p className="text-sm text-gray-600">{t('agent.enjoyCommission')}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h2 className="text-lg font-bold text-gray-900 mb-1">
                {t('agent.notActivated')}
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                {t('agent.activationRequirement')}
              </p>
              <Button variant="outline">{t('agent.goPromote')}</Button>
            </div>
          )}

          {agentData.isActive && (
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {agentData.totalReferrals}
                </p>
                <p className="text-sm text-gray-600">{t('agent.referralCount')}</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(agentData.todayCommission)}
                </p>
                <p className="text-sm text-gray-600">{t('agent.todayCommission')}</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(agentData.totalCommission)}
                </p>
                <p className="text-sm text-gray-600">{t('agent.totalCommission')}</p>
              </div>
            </div>
          )}
        </Card>

        {/* 邀请好友卡片 */}
        {user && (
          <Card className="p-6 bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <Gift className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold">{t('profile.inviteFriends')}</h3>
                <p className="text-sm text-white/90">{t('profile.inviteFriendsDescription')}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="bg-white/10 rounded-lg p-3">
                <p className="text-xs text-white/80 mb-1">{t('profile.yourInviteCode')}</p>
                <p className="text-xl font-bold tracking-wider">{user.inviteCode}</p>
              </div>
              <Button
                onClick={handleShare}
                className="w-full bg-white text-purple-600 hover:bg-white/90"
              >
                <Share2 className="w-4 h-4 mr-2" />
                {t('profile.shareInvite')}
              </Button>
            </div>
          </Card>
        )}

        {/* 推广链接和二维码 */}
        {agentData.isActive && (
          <Card className="p-4">
            <h3 className="font-semibold text-gray-900 mb-3">{t('agent.promotionMethods')}</h3>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="flex flex-col items-center gap-2 h-auto py-4"
                onClick={handleCopyLink}
              >
                <LinkIcon className="w-6 h-6" />
                <span className="text-sm">{t('agent.copyLink')}</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center gap-2 h-auto py-4"
                onClick={handleShare}
              >
                <Share2 className="w-6 h-6" />
                <span className="text-sm">{t('agent.shareQRCode')}</span>
              </Button>
            </div>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="users">{t('agent.subUsers')}</TabsTrigger>
            <TabsTrigger value="commissions">{t('agent.commissionDetails')}</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-3 mt-4">
            {subUsers.map((user) => (
              <Card key={user.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{user.phone}</p>
                    <p className="text-sm text-gray-600">
                      {t('agent.registrationDate')}: {user.registeredAt}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{user.taskCount}</p>
                    <p className="text-sm text-gray-600">{t('agent.completedTasks')}</p>
                  </div>
                </div>
              </Card>
            ))}

            {subUsers.length === 0 && (
              <Card className="p-6 text-center text-gray-500 text-sm">
                {t('agent.noSubUsers')}
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
                        {formatCurrency(commission.amount)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {t('agent.from')}: {commission.fromUser}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={
                        commission.type === 'payout' ? 'default' : 'secondary'
                      }
                    >
                      {commission.type === 'payout' ? t('agent.payout') : t('agent.payin')}
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
                {t('agent.noCommissions')}
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* 分享对话框 */}
      <ShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        shareUrl={shareUrl}
        title={t('agent.shareInvite')}
        description={t('agent.shareInviteDescription')}
      />
    </MainLayout>
  );
}
