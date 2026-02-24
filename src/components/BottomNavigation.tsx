'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CreditCard, DollarSign, User, Users } from 'lucide-react';

const navItems = [
  { href: '/tasks/payout', label: '代付任务', icon: CreditCard },
  { href: '/tasks/payin', label: '代收任务', icon: DollarSign },
  { href: '/profile', label: '我的', icon: User },
  { href: '/agent', label: '代理', icon: Users },
];

export default function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-bottom">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive ? 'text-blue-600' : 'text-gray-500'
              }`}
            >
              <Icon className="w-6 h-6 mb-1" />
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
