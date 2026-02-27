/**
 * Task Wallet 设计系统 - 字体配置
 * 专业金融级字体系统，注重可读性和多语言支持
 */

// ==================== 字体家族 ====================
/**
 * 字体家族：优先使用系统字体，确保最佳性能
 * 兼容西文、中文、日文、韩文等多语言
 */
export const fontFamily = {
  // 无衬线字体（主要字体）
  sans: [
    // 西文优先
    '-apple-system',
    'BlinkMacSystemFont',
    'Inter',
    '"Segoe UI"',
    '"Helvetica Neue"',
    'Arial',
    'sans-serif',
    // 中文支持
    '"Noto Sans SC"',
    '"PingFang SC"',
    '"Hiragino Sans GB"',
    '"Microsoft YaHei"',
    'sans-serif',
    // 日文支持
    '"Noto Sans JP"',
    '"Hiragino Kaku Gothic Pro"',
    'sans-serif',
    // 韩文支持
    '"Noto Sans KR"',
    '"Malgun Gothic"',
    'sans-serif',
  ],

  // 衬线字体（特殊场景）
  serif: [
    '"Georgia"',
    '"Cambria"',
    '"Times New Roman"',
    'Times',
    'serif',
  ],

  // 等宽字体（代码、数字）
  mono: [
    // 等宽字体优先
    'JetBrains Mono',
    'SF Mono',
    'Monaco',
    'Cascadia Code',
    'Roboto Mono',
    'Consolas',
    '"Courier New"',
    'monospace',
  ],

  // 数字字体（金融数据）
  numbers: [
    'SF Mono',
    'Roboto Mono',
    'JetBrains Mono',
    'monospace',
  ],
};

// ==================== 字体大小 ====================
/**
 * 字体大小：使用 rem 单位，确保响应式
 * 基于 16px 基准
 */
export const fontSize = {
  xs: '0.75rem',      // 12px - 辅助文字、标签
  sm: '0.875rem',     // 14px - 小号文字、说明
  base: '1rem',       // 16px - 正文（基准）
  lg: '1.125rem',     // 18px - 强调文字
  xl: '1.25rem',      // 20px - 小标题
  '2xl': '1.5rem',    // 24px - 标题
  '3xl': '1.875rem',  // 30px - 大标题
  '4xl': '2.25rem',   // 36px - 超大标题
  '5xl': '3rem',      // 48px - 特大标题
  '6xl': '3.75rem',   // 60px - 巨大标题
};

// ==================== 字重 ====================
/**
 * 字重：从轻到粗，用于表达视觉层次
 */
export const fontWeight = {
  thin: '100',        // 极细 - 装饰性文字
  extralight: '200',  // 极轻 - 很少使用
  light: '300',       // 轻 - 标题辅助
  regular: '400',     // 常规 - 正文
  medium: '500',      // 中等 - 强调文字
  semibold: '600',    // 半粗 - 小标题
  bold: '700',        // 粗体 - 标题
  extrabold: '800',   // 极粗 - 特殊强调
  black: '900',       // 最粗 - 很少使用
};

// ==================== 行高 ====================
/**
 * 行高：控制文字垂直间距
 * 使用无单位值，基于字体大小
 */
export const lineHeight = {
  none: '1',          // 无行高（极少使用）
  tight: '1.25',      // 紧凑 - 大标题
  snug: '1.375',      // 紧凑 - 小标题
  normal: '1.5',      // 正常 - 正文
  relaxed: '1.625',   // 宽松 - 阅读文本
  loose: '2',         // 宽松 - 很少使用
};

// ==================== 字母间距 ====================
/**
 * 字母间距：控制文字水平间距
 * 使用 em 单位，随字体大小变化
 */
export const letterSpacing = {
  tighter: '-0.05em',  // 更紧 - 大号标题
  tight: '-0.025em',   // 紧凑 - 中号标题
  normal: '0em',       // 正常 - 正文
  wide: '0.025em',     // 宽松 - 小号文字
  wider: '0.05em',     // 更宽 - 装饰文字
  widest: '0.1em',     // 最宽 - 特殊效果
};

// ==================== 排版层级 ====================
/**
 * 排版层级：定义不同层级文字的样式
 * 用于构建清晰的视觉层次
 */
export const typography = {
  // Hero 标题（超大标题）
  hero: {
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.tight,
    letterSpacing: letterSpacing.tighter,
  },

  // H1 - 页面主标题
  h1: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.tight,
    letterSpacing: letterSpacing.tighter,
  },

  // H2 - 章节标题
  h2: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.snug,
    letterSpacing: letterSpacing.tight,
  },

  // H3 - 小节标题
  h3: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.snug,
    letterSpacing: letterSpacing.normal,
  },

  // H4 - 卡片标题
  h4: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.snug,
    letterSpacing: letterSpacing.normal,
  },

  // Body - 正文
  body: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },

  // Body Small - 小号正文
  bodySmall: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },

  // Caption - 说明文字
  caption: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.relaxed,
    letterSpacing: letterSpacing.normal,
  },

  // Label - 标签文字
  label: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.tight,
    letterSpacing: letterSpacing.wide,
  },

  // Button - 按钮文字
  button: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.tight,
    letterSpacing: letterSpacing.normal,
  },

  // Link - 链接文字
  link: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },

  // Price - 价格文字
  price: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.tight,
    letterSpacing: letterSpacing.normal,
  },

  // Code - 代码文字
  code: {
    fontFamily: fontFamily.mono.join(', '),
    fontSize: fontSize.sm,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },
};

// ==================== 数字格式化 ====================
/**
 * 数字格式化：金融数据专用字体样式
 */
export const numberFormat = {
  // 货币显示
  currency: {
    fontFamily: fontFamily.numbers.join(', '),
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.tight,
    letterSpacing: letterSpacing.tight,
  },

  // 百分比
  percentage: {
    fontFamily: fontFamily.numbers.join(', '),
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },

  // 大数字
  largeNumber: {
    fontFamily: fontFamily.numbers.join(', '),
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.tight,
    letterSpacing: letterSpacing.tight,
  },
};

// ==================== CSS 变量映射 ====================
export const fontVariables = {
  '--font-sans': fontFamily.sans.join(', '),
  '--font-serif': fontFamily.serif.join(', '),
  '--font-mono': fontFamily.mono.join(', '),
  '--font-numbers': fontFamily.numbers.join(', '),
};

// ==================== 导出完整字体系统 ====================
export const fontSystem = {
  family: fontFamily,
  size: fontSize,
  weight: fontWeight,
  lineHeight,
  letterSpacing,
  typography,
  numberFormat,
};

// ==================== Tailwind 扩展配置 ====================
export const tailwindFontConfig = {
  fontFamily,
  fontSize: {
    ...fontSize,
    hero: fontSize['4xl'],
  },
  fontWeight,
  lineHeight,
  letterSpacing,
};
