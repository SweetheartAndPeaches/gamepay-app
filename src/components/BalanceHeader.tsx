'use client';

import { useState, useEffect } from 'react';
import { useI18n } from '@/i18n/context';

interface Balance {
  available: string;
  frozen: string;
}

export default function BalanceHeader() {
  const { t, formatCurrency } = useI18n();
  const [balance, setBalance] = useState<Balance>({
    available: '0.00',
    frozen: '0.00',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: 从 API 获取余额
    // 暂时使用模拟数据
    setBalance({
      available: '0.00',
      frozen: '0.00',
    });
    setLoading(false);
  }, []);

  if (loading) {
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
          <span className="text-3xl font-bold">{formatCurrency(balance.available)}</span>
          {parseFloat(balance.frozen) > 0 && (
            <span className="text-sm text-blue-100">
              {t('balance.frozen')}: {formatCurrency(balance.frozen)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
