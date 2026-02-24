import { Locale } from './config';
import zhCN from './zh-CN.json';
import enUS from './en-US.json';
import jaJP from './ja-JP.json';
import koKR from './ko-KR.json';
import esES from './es-ES.json';
import frFR from './fr-FR.json';
import deDE from './de-DE.json';

// 翻译映射表
const translationsMap: Record<Locale, any> = {
  'zh-CN': zhCN,
  'en-US': enUS,
  'ja-JP': jaJP,
  'ko-KR': koKR,
  'es-ES': esES,
  'fr-FR': frFR,
  'de-DE': deDE,
};

/**
 * 加载翻译文件
 */
export async function loadTranslations(locale: Locale, forceReload: boolean = false): Promise<any> {
  console.log(`[Loader] Loading translations for locale: ${locale}, forceReload: ${forceReload}`);
  
  // 直接从映射表中获取翻译
  const translations = translationsMap[locale];
  
  if (!translations) {
    console.error(`[Loader] No translations found for locale: ${locale}`);
    return {};
  }
  
  console.log(`[Loader] Loaded translations for ${locale}:`, {
    keys: Object.keys(translations),
    hasTasks: !!translations.tasks,
    hasPayout: !!translations.tasks?.payout,
    samplePayoutKeys: translations.tasks?.payout ? 
      Object.keys(translations.tasks.payout).slice(0, 5) : [],
  });
  
  return translations;
}

/**
 * 获取嵌套对象的值
 * 例如：getNestedValue(obj, 'common.confirm') => obj.common.confirm
 */
export function getNestedValue(obj: any, path: string): string {
  if (!obj || typeof obj !== 'object') {
    console.warn(`[getNestedValue] Invalid object for path: ${path}`, obj);
    return path;
  }
  
  try {
    const result = path.split('.').reduce((current, key) => {
      if (!current || typeof current !== 'object') {
        return undefined;
      }
      return current[key];
    }, obj);
    
    if (result !== undefined && result !== null) {
      return String(result);
    }
    
    // 调试日志
    console.warn(`[getNestedValue] Translation not found for key: ${path}`, {
      path,
      objKeys: Object.keys(obj),
      pathParts: path.split('.'),
    });
    
    return path;
  } catch (error) {
    console.error(`[getNestedValue] Error getting nested value for path: ${path}`, error);
    return path;
  }
}
