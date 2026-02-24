import { Locale } from './config';

// 翻译缓存
const translationsCache: Map<string, any> = new Map();

/**
 * 加载翻译文件
 */
export async function loadTranslations(locale: Locale) {
  if (translationsCache.has(locale)) {
    return translationsCache.get(locale);
  }

  try {
    const messages = await import(`./${locale}.json`);
    translationsCache.set(locale, messages.default);
    return messages.default;
  } catch (error) {
    console.error(`Failed to load translations for locale: ${locale}`, error);
    // 如果加载失败，返回英文翻译作为回退
    try {
      const fallback = await import('./en-US.json');
      translationsCache.set(locale, fallback.default);
      return fallback.default;
    } catch (fallbackError) {
      console.error('Failed to load fallback translations');
      return {};
    }
  }
}

/**
 * 获取嵌套对象的值
 * 例如：getNestedValue(obj, 'common.confirm') => obj.common.confirm
 */
export function getNestedValue(obj: any, path: string): string {
  return path.split('.').reduce((current, key) => current?.[key], obj) || path;
}
