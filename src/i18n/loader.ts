'use client';

import { Locale } from './config';

// 加载翻译文件
export async function loadTranslations(locale: Locale, forceReload = false): Promise<any> {
  try {
    // 在 Next.js 中，动态导入翻译文件
    const translations = await import(`../translations/${locale}.ts`);
    return translations.default || translations;
  } catch (error) {
    console.error(`Failed to load translations for locale: ${locale}`, error);
    // 如果加载失败，返回空对象
    return {};
  }
}

// 获取嵌套值
export function getNestedValue(obj: any, path: string): string {
  const keys = path.split('.');
  let value = obj;
  
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return path; // 返回原始路径作为回退
    }
  }
  
  return typeof value === 'string' ? value : path;
}
