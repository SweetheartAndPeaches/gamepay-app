// 支持的语言列表
export const locales = ['zh-CN', 'en-US', 'ja-JP', 'ko-KR', 'es-ES', 'fr-FR', 'de-DE'] as const;
export type Locale = (typeof locales)[number];

// 默认语言
export const defaultLocale: Locale = 'en-US';

// 语言名称映射
export const localeNames: Record<Locale, string> = {
  'zh-CN': '简体中文',
  'en-US': 'English',
  'ja-JP': '日本語',
  'ko-KR': '한국어',
  'es-ES': 'Español',
  'fr-FR': 'Français',
  'de-DE': 'Deutsch',
};

// 货币映射
export const currencyMap: Record<Locale, string> = {
  'zh-CN': 'CNY',
  'en-US': 'USD',
  'ja-JP': 'JPY',
  'ko-KR': 'KRW',
  'es-ES': 'EUR',
  'fr-FR': 'EUR',
  'de-DE': 'EUR',
};

// 货币符号映射
export const currencySymbols: Record<string, string> = {
  CNY: '¥',
  USD: '$',
  EUR: '€',
  JPY: '¥',
  KRW: '₩',
  GBP: '£',
  AUD: 'A$',
  CAD: 'C$',
};

// 语言方向（LTR 或 RTL）
export const localeDirection: Record<Locale, 'ltr' | 'rtl'> = {
  'zh-CN': 'ltr',
  'en-US': 'ltr',
  'ja-JP': 'ltr',
  'ko-KR': 'ltr',
  'es-ES': 'ltr',
  'fr-FR': 'ltr',
  'de-DE': 'ltr',
};
