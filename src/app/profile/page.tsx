'use client';

import { useState } from 'react';
import Link from 'next/link';
import MainLayout from '@/components/MainLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
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
  const [user] = useState({
    phone: '138****8888',
    inviteCode: 'ABC12345',
  });

  const menuItems = [
    {
      icon: CreditCard,
      label: '收付款账户',
      href: '/profile/accounts',
      description: '管理微信、支付宝账户',
    },
    {
      icon: Wallet,
      label: '余额明细',
      href: '/profile/balance',
      description: '查看余额变动记录',
    },
    {
      icon: Shield,
      label: '安全设置',
      href: '/profile/security',
      description: '修改密码、谷歌验证',
    },
    {
      icon: FileText,
      label: '任务说明',
      href: '/profile/instructions',
      description: '查看任务规则和费率',
    },
    {
      icon: Settings,
      label: '系统设置',
      href: '/profile/settings',
      description: '应用设置',
    },
  ];

  const handleLogout = () => {
    // TODO: 实现登出逻辑
    console.log('Logout');
  };

  return (
    <MainLayout showBalance={false}>
      <div className="p-4 space-y-4">
        {/* 用户信息卡片 */}
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16 bg-blue-600">
              <span className="text-white text-2xl font-bold">
                {user.phone.charAt(0)}
              </span>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">
                {user.phone}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                邀请码：{user.inviteCode}
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
                    <h3 className="font-medium text-gray-900">{item.label}</h3>
                    <p className="text-sm text-gray-600">{item.description}</p>
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
          退出登录
        </Button>
      </div>
    </MainLayout>
  );
}
