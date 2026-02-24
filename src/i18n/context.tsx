'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Locale, defaultLocale, currencyMap, currencySymbols } from './config';
import { loadTranslations, getNestedValue } from './loader';

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  formatCurrency: (amount: number | string) => string;
  formatDate: (date: Date | string) => string;
  formatNumber: (num: number) => string;
  availableLocales: readonly Locale[];
  localeNames: Record<Locale, string>;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

interface I18nProviderProps {
  children: React.ReactNode;
  initialLocale?: Locale;
}

export function I18nProvider({ children, initialLocale = defaultLocale }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [translations, setTranslations] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);

  // 从 localStorage 加载语言设置
  useEffect(() => {
    const savedLocale = localStorage.getItem('locale') as Locale;
    if (savedLocale && ['zh-CN', 'en-US', 'ja-JP', 'ko-KR', 'es-ES', 'fr-FR', 'de-DE'].includes(savedLocale)) {
      setLocaleState(savedLocale);
    }
  }, []);

  // 加载翻译文件
  useEffect(() => {
    setIsLoading(true);
    // 强制重新加载翻译，不使用缓存
    loadTranslations(locale, true)
      .then((loadedTranslations) => {
        console.log(`[Effect] Loaded translations for ${locale}:`, {
          keys: Object.keys(loadedTranslations),
          hasTasks: !!loadedTranslations.tasks,
          hasPayout: !!loadedTranslations.tasks?.payout,
          samplePayoutKeys: loadedTranslations.tasks?.payout ? Object.keys(loadedTranslations.tasks.payout).slice(0, 5) : [],
        });
        setTranslations(loadedTranslations);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Failed to load translations:', error);
        setIsLoading(false);
      });
  }, [locale]);

  // 设置语言
  const setLocale = useCallback((newLocale: Locale) => {
    console.log(`Setting locale to ${newLocale}`);
    setLocaleState(newLocale);
    localStorage.setItem('locale', newLocale);
    document.documentElement.lang = newLocale;
  }, []);

  // 翻译函数
  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    if (isLoading && Object.keys(translations).length === 0) {
      return key; // 如果还在加载，返回键本身
    }
    let text = getNestedValue(translations, key);
    
    // 调试日志
    if (text === key && !isLoading) {
      console.warn(`Translation not found for key: ${key}`, { locale, translations });
    }

    // 如果参数存在，进行替换
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        text = text.replace(new RegExp(`{${param}}`, 'g'), String(value));
      });
    }

    return text;
  }, [translations]);

  // 格式化货币
  const formatCurrency = useCallback((amount: number | string): string => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    const currency = currencyMap[locale];
    const symbol = currencySymbols[currency] || currency;

    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  }, [locale]);

  // 格式化日期
  const formatDate = useCallback((date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(dateObj);
  }, [locale]);

  // 格式化数字
  const formatNumber = useCallback((num: number): string => {
    return new Intl.NumberFormat(locale).format(num);
  }, [locale]);

  const value: I18nContextType = {
    locale,
    setLocale,
    t,
    formatCurrency,
    formatDate,
    formatNumber,
    availableLocales: ['zh-CN', 'en-US', 'ja-JP', 'ko-KR', 'es-ES', 'fr-FR', 'de-DE'] as const,
    localeNames: {
      'zh-CN': '简体中文',
      'en-US': 'English',
      'ja-JP': '日本語',
      'ko-KR': '한국어',
      'es-ES': 'Español',
      'fr-FR': 'Français',
      'de-DE': 'Deutsch',
    },
  };

  // 在翻译加载期间显示加载指示器
  if (isLoading && Object.keys(translations).length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/**
 * 使用国际化 Hook
 */
export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}
