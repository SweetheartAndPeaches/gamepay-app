/**
 * Task Wallet 设计系统 - 配色方案
 * 专业金融级配色方案，注重可访问性和品牌识别度
 */

// ==================== 品牌色 ====================
/**
 * 主色：金黄色系
 * 寓意：财富、信任、专业
 * 适用：按钮、链接、激活状态、强调元素
 */
export const brandColors = {
  // 主色 - 50 到 950，从浅到深
  primary: {
    50: '#fefce8',   // 极浅黄，用于 hover 背景等
    100: '#fef9c3',  // 浅黄
    200: '#fef08a',  // 浅金黄色
    300: '#fde047',  // 金黄色
    400: '#facc15',  // 明亮金
    500: '#eab308',  // 主金色（推荐使用）
    600: '#ca8a04',  // 深金（推荐用于 hover）
    700: '#a16207',  // 深金色
    800: '#854d0e',  // 深褐金
    900: '#713f12',  // 极深金
    950: '#422006',  // 最深金
  },

  // 辅助色 - 蓝色系
  secondary: {
    50: '#eff6ff',   // 极浅蓝
    100: '#dbeafe',  // 浅蓝
    200: '#bfdbfe',  // 浅天蓝
    300: '#93c5fd',  // 天蓝色
    400: '#60a5fa',  // 亮蓝
    500: '#3b82f6',  // 主蓝色（推荐使用）
    600: '#2563eb',  // 深蓝（推荐用于 hover）
    700: '#1d4ed8',  // 深蓝色
    800: '#1e40af',  // 极深蓝
    900: '#1e3a8a',  // 最深蓝
    950: '#172554',  // 深邃蓝
  },
};

// ==================== 语义色 ====================
/**
 * 语义色：用于传达状态和反馈
 * 遵循 WCAG AA 可访问性标准
 */
export const semanticColors = {
  // 成功 - 绿色系
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e', // 主成功色
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
    950: '#052e16',
  },

  // 警告 - 橙色系
  warning: {
    50: '#fff7ed',
    100: '#ffedd5',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#f97316', // 主警告色
    600: '#ea580c',
    700: '#c2410c',
    800: '#9a3412',
    900: '#7c2d12',
    950: '#431407',
  },

  // 错误 - 红色系
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444', // 主错误色
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
    950: '#450a0a',
  },

  // 信息 - 蓝色系
  info: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9', // 主信息色
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
    950: '#082f49',
  },
};

// ==================== 中性色（深色主题）====================
/**
 * 中性色：用于背景、边框、文字等基础元素
 * 专为深色主题设计，确保良好的对比度
 */
export const neutralColors = {
  // 背景色
  bg: {
    primary: '#0b0e11',     // 主背景 - 深黑色
    secondary: '#14171a',   // 次背景 - 深灰黑
    tertiary: '#1e2329',    // 第三背景 - 深灰
    elevated: '#2b3139',    // 悬浮背景 - 中灰
    overlay: '#000000',     // 遮罩层 - 纯黑
  },

  // 边框色
  border: {
    default: '#2b3139',     // 默认边框
    subtle: '#474d57',      // 微妙边框（hover）
    strong: '#0e1318',      // 强边框（激活）
    divider: '#2b3139',     // 分割线
  },

  // 文字色
  text: {
    primary: '#f0f3f5',     // 主要文字 - 接近纯白
    secondary: '#848e9c',   // 次要文字 - 中灰
    tertiary: '#5e6673',    // 第三文字 - 深灰
    disabled: '#474d57',    // 禁用文字
    inverse: '#0b0e11',     // 反向文字（在金色背景上）
  },

  // 灰度色阶（50-950）
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
    950: '#030712',
  },
};

// ==================== 功能性色 ====================
/**
 * 功能性色：用于特定功能和状态
 */
export const functionalColors = {
  // 渐变
  gradients: {
    primary: 'linear-gradient(135deg, #f0b90b 0%, #ca8a04 100%)',
    secondary: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    success: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
    dark: 'linear-gradient(135deg, #0b0e11 0%, #14171a 100%)',
  },

  // 阴影
  shadow: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.4)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.6)',
    glow: '0 0 20px rgba(234, 179, 8, 0.3)', // 金色光晕
  },
};

// ==================== 导出完整配色方案 ====================
export const colorScheme = {
  brand: brandColors,
  semantic: semanticColors,
  neutral: neutralColors,
  functional: functionalColors,
};

// ==================== 预设主题 ====================
export const lightTheme = {
  background: '#ffffff',
  foreground: '#0b0e11',
  card: '#ffffff',
  'card-foreground': '#0b0e11',
  popover: '#ffffff',
  'popover-foreground': '#0b0e11',
  primary: '#eab308',
  'primary-foreground': '#0b0e11',
  secondary: '#f1f5f9',
  'secondary-foreground': '#0b0e11',
  muted: '#f1f5f9',
  'muted-foreground': '#64748b',
  accent: '#f1f5f9',
  'accent-foreground': '#0b0e11',
  destructive: '#ef4444',
  'destructive-foreground': '#ffffff',
  border: '#e2e8f0',
  input: '#e2e8f0',
  ring: '#eab308',
  radius: '0.5rem',
};

export const darkTheme = {
  background: '#0b0e11',
  foreground: '#f0f3f5',
  card: '#14171a',
  'card-foreground': '#f0f3f5',
  popover: '#14171a',
  'popover-foreground': '#f0f3f5',
  primary: '#eab308',
  'primary-foreground': '#0b0e11',
  secondary: '#2b3139',
  'secondary-foreground': '#f0f3f5',
  muted: '#2b3139',
  'muted-foreground': '#848e9c',
  accent: '#2b3139',
  'accent-foreground': '#f0f3f5',
  destructive: '#ef4444',
  'destructive-foreground': '#ffffff',
  border: '#2b3139',
  input: '#2b3139',
  ring: '#eab308',
  radius: '0.5rem',
};

// ==================== CSS 变量映射 ====================
export const cssVariables = {
  '--background': neutralColors.bg.primary,
  '--foreground': neutralColors.text.primary,
  '--card': neutralColors.bg.secondary,
  '--card-foreground': neutralColors.text.primary,
  '--popover': neutralColors.bg.secondary,
  '--popover-foreground': neutralColors.text.primary,
  '--primary': brandColors.primary[500],
  '--primary-foreground': neutralColors.text.inverse,
  '--secondary': neutralColors.bg.tertiary,
  '--secondary-foreground': neutralColors.text.primary,
  '--muted': neutralColors.bg.tertiary,
  '--muted-foreground': neutralColors.text.secondary,
  '--accent': neutralColors.bg.tertiary,
  '--accent-foreground': neutralColors.text.primary,
  '--destructive': semanticColors.error[500],
  '--destructive-foreground': '#ffffff',
  '--border': neutralColors.border.default,
  '--input': neutralColors.border.default,
  '--ring': brandColors.primary[500],
  '--radius': '0.5rem',
};
