/**
 * Task Wallet 设计系统 - 统一入口
 * 完整的设计系统配置
 */

export { colorScheme, lightTheme, darkTheme, cssVariables } from './colors';
export { fontSystem, tailwindFontConfig } from './typography';

// ==================== 完整设计系统 ====================
export const designSystem = {
  colors: {
    scheme: {
      brand: {
        primary: '#eab308',
        primaryHover: '#ca8a04',
        primaryActive: '#a16207',
      },
      secondary: {
        blue: '#3b82f6',
        blueHover: '#2563eb',
      },
      success: '#22c55e',
      warning: '#f97316',
      error: '#ef4444',
      info: '#0ea5e9',
    },
    background: {
      primary: '#0b0e11',
      secondary: '#14171a',
      tertiary: '#1e2329',
      elevated: '#2b3139',
    },
    border: {
      default: '#2b3139',
      subtle: '#474d57',
      strong: '#0e1318',
    },
    text: {
      primary: '#f0f3f5',
      secondary: '#848e9c',
      tertiary: '#5e6673',
      disabled: '#474d57',
    },
  },

  typography: {
    fontFamily: {
      sans: '-apple-system, BlinkMacSystemFont, Inter, "Segoe UI", "Helvetica Neue", Arial, sans-serif',
      mono: 'JetBrains Mono, SF Mono, Monaco, monospace',
      numbers: 'SF Mono, Roboto Mono, monospace',
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
    },
    fontWeight: {
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.625',
    },
  },

  spacing: {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem',   // 48px
    '3xl': '4rem',   // 64px
  },

  borderRadius: {
    sm: '0.25rem',   // 4px
    md: '0.5rem',    // 8px
    lg: '0.75rem',   // 12px
    xl: '1rem',      // 16px
    '2xl': '1.5rem', // 24px
    full: '9999px',
  },

  shadow: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.4)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.6)',
    glow: '0 0 20px rgba(234, 179, 8, 0.3)',
  },

  transition: {
    fast: '150ms ease-in-out',
    normal: '200ms ease-in-out',
    slow: '300ms ease-in-out',
  },

  zIndex: {
    dropdown: 100,
    sticky: 200,
    fixed: 300,
    modal: 400,
    popover: 500,
    tooltip: 600,
  },
};

// ==================== 使用指南 ====================
/**
 * 使用示例：
 *
 * // 1. 在组件中使用配色
 * import { designSystem } from '@/lib/theme';
 * const primaryColor = designSystem.colors.brand.primary;
 *
 * // 2. 使用排版层级
 * import { typography } from '@/lib/theme/typography';
 * const h1Style = typography.h1;
 *
 * // 3. 使用 Tailwind 扩展
 * // 配置文件中已包含完整的设计系统
 */

export default designSystem;
