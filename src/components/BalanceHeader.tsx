'use client';

import { useEffect } from 'react';
import { useI18n } from '@/i18n/context';
import { useAuth } from '@/contexts/AuthContext';

export default function BalanceHeader() {
  const { t, formatCurrency } = useI18n();
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
        <div className="max-w-md mx-auto">
          <div className="animate-pulse">
            <div className="h-4 bg-white/30 rounded w-1/3 mb-2"></div>
            <div className="h-8 bg-white/30 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 shadow-md">
      <div className="max-w-md mx-auto">
        <p className="text-sm text-blue-100 mb-1">{t('balance.available')}</p>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold">{formatCurrency(user.balance.toString())}</span>
          {user.frozenBalance > 0 && (
            <span className="text-sm text-blue-100">
              {t('balance.frozen')}: {formatCurrency(user.frozenBalance.toString())}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
