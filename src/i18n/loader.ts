import { Locale } from './config';

// 翻译缓存
const translationsCache: Map<string, any> = new Map();

// 预导入所有翻译文件
const translationModules = {
  'zh-CN': () => import('./zh-CN.json'),
  'en-US': () => import('./en-US.json'),
  'ja-JP': () => import('./ja-JP.json'),
  'ko-KR': () => import('./ko-KR.json'),
  'es-ES': () => import('./es-ES.json'),
  'fr-FR': () => import('./fr-FR.json'),
  'de-DE': () => import('./de-DE.json'),
} as const;

/**
 * 清除翻译缓存
 */
export function clearTranslationCache(locale?: Locale) {
  if (locale) {
    translationsCache.delete(locale);
    console.log(`Cleared translation cache for ${locale}`);
  } else {
    translationsCache.clear();
    console.log('Cleared all translation cache');
  }
}

/**
 * 加载翻译文件
 */
export async function loadTranslations(locale: Locale, forceReload: boolean = false) {
  // 如果强制重新加载，清除缓存
  if (forceReload) {
    clearTranslationCache(locale);
  }

  if (translationsCache.has(locale)) {
    console.log(`Using cached translations for ${locale}`);
    return translationsCache.get(locale);
  }

  try {
    const loader = translationModules[locale as keyof typeof translationModules];
    if (!loader) {
      throw new Error(`Unsupported locale: ${locale}`);
    }

    const messages = await loader();
    const translations = messages.default;
    translationsCache.set(locale, translations);
    console.log(`Loaded and cached translations for ${locale}`);
    return translations;
  } catch (error) {
    console.error(`Failed to load translations for locale: ${locale}`, error);
    // 如果加载失败，返回英文翻译作为回退
    try {
      const fallback = await import('./en-US.json');
      translationsCache.set(locale, fallback.default);
      console.log(`Using fallback translations for ${locale}`);
      return fallback.default;
    } catch (fallbackError) {
      console.error('Failed to load fallback translations', fallbackError);
      return {};
    }
  }
}

/**
 * 获取嵌套对象的值
 * 例如：getNestedValue(obj, 'common.confirm') => obj.common.confirm
 */
export function getNestedValue(obj: any, path: string): string {
  try {
    const result = path.split('.').reduce((current, key) => current?.[key], obj);
    if (result !== undefined && result !== null) {
      return String(result);
    }
    
    // 调试日志
    console.warn(`Translation not found for key: ${path}`, {
      path,
      objKeys: Object.keys(obj),
      pathParts: path.split('.'),
    });
    
    return path;
  } catch (error) {
    console.error(`Error getting nested value for path: ${path}`, error);
    return path;
  }
}
