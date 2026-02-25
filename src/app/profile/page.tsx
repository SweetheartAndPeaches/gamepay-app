'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/MainLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { useI18n } from '@/i18n/context';
import { useAuth } from '@/contexts/AuthContext';
import {
  Settings,
  Shield,
  CreditCard,
  Wallet,
  FileText,
  LogOut,
  ChevronRight,
} from 'lucide-react';

export default function ProfilePage() {
  const { t } = useI18n();
  const { user, logout } = useAuth();
  const router = useRouter();

  // 检查是否登录
  useEffect(() => {
    if (!user) {
      router.push('/');
    }
  }, [user, router]);

  const menuItems = [
    {
      icon: CreditCard,
      label: 'profile.accounts',
      href: '/profile/accounts',
      description: 'profile.accountsDescription',
    },
    {
      icon: Wallet,
      label: 'profile.balanceDetails',
      href: '/profile/balance',
      description: 'profile.balanceDescription',
    },
    {
      icon: Shield,
      label: 'profile.security',
      href: '/profile/security',
      description: 'profile.securityDescription',
    },
    {
      icon: FileText,
      label: 'profile.instructions',
      href: '/profile/instructions',
      description: 'profile.instructionsDescription',
    },
    {
      icon: Settings,
      label: 'profile.settings',
      href: '/profile/settings',
      description: 'profile.settingsDescription',
    },
  ];

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  // 如果用户未登录，不渲染内容
  if (!user) {
    return null;
  }

  // 格式化手机号，隐藏中间4位
  const maskedPhone = user.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');

  return (
    <MainLayout showBalance={false}>
      <div className="p-4 space-y-4">
        {/* 用户信息卡片 */}
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16 bg-blue-600">
              <span className="text-white text-2xl font-bold">
                {maskedPhone.charAt(0)}
              </span>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">
                {maskedPhone}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {t('profile.inviteCode')}：{user.inviteCode}
              </p>
            </div>
          </div>
        </Card>

        {/* 功能菜单 */}
        <Card>
          <div className="divide-y">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{t(item.label)}</h3>
                    <p className="text-sm text-gray-600">{t(item.description)}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </Link>
              );
            })}
          </div>
        </Card>

        {/* 退出登录按钮 */}
        <Button
          variant="outline"
          className="w-full"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          {t('auth.logout')}
        </Button>
      </div>
    </MainLayout>
  );
}
