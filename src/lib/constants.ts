// 任务类型
export const TASK_TYPES = {
  PAYOUT: 'payout', // 代付
  PAYIN: 'payin', // 代收
} as const;

// 任务状态
export const TASK_STATUS = {
  PENDING: 'pending', // 待领取
  CLAIMED: 'claimed', // 已领取
  COMPLETED: 'completed', // 已完成
  CANCELLED: 'cancelled', // 已取消
  TIMEOUT: 'timeout', // 已超时
} as const;

// 账户类型（支持国际支付）
export const ACCOUNT_TYPES = {
  // 中国支付方式
  WECHAT_QRCODE: 'wechat_qrcode', // 微信二维码
  ALIPAY_QRCODE: 'alipay_qrcode', // 支付宝二维码
  ALIPAY_ACCOUNT: 'alipay_account', // 支付宝账号
  BANK_CARD: 'bank_card', // 银行卡

  // 国际支付方式
  PAYPAL: 'paypal', // PayPal
  VENMO: 'venmo', // Venmo (美国)
  CASHAPP: 'cashapp', // Cash App (美国)
  ZELLE: 'zelle', // Zelle (美国)
  STRIPE: 'stripe', // Stripe (全球)
  WISE: 'wise', // Wise (全球)
  PAYONEER: 'payoneer', // Payoneer (全球)
  SWIFT: 'swift', // SWIFT 银行转账 (全球)
} as const;

// 用户状态
export const USER_STATUS = {
  ACTIVE: 'active', // 正常
  SUSPENDED: 'suspended', // 暂停
  BANNED: 'banned', // 封禁
} as const;

// 交易类型
export const TRANSACTION_TYPES = {
  TASK_REWARD: 'task_reward', // 任务奖励
  COMMISSION: 'commission', // 佣金
  WITHDRAWAL: 'withdrawal', // 提现
  DEPOSIT: 'deposit', // 充值
  FREEZE: 'freeze', // 冻结
  UNFREEZE: 'unfreeze', // 解冻
} as const;

// 佣金类型
export const COMMISSION_TYPES = {
  PAYOUT: 'payout',
  PAYIN: 'payin',
} as const;

// 提现状态
export const WITHDRAWAL_STATUS = {
  PENDING: 'pending', // 待审核
  PROCESSING: 'processing', // 处理中
  COMPLETED: 'completed', // 已完成
  REJECTED: 'rejected', // 已拒绝
} as const;

// 代理状态
export const AGENT_STATUS = {
  ACTIVE: 'active', // 激活
  SUSPENDED: 'suspended', // 暂停
} as const;

// 佣金状态
export const COMMISSION_STATUS = {
  PENDING: 'pending', // 待结算
  SETTLED: 'settled', // 已结算
} as const;

// 默认金额区间配置
export const DEFAULT_AMOUNT_RANGES = [
  { range: '100-500', minDailyTasks: 3 },
  { range: '501-1000', minDailyTasks: 5 },
  { range: '1001-2000', minDailyTasks: 3 },
  { range: '2001-5000', minDailyTasks: 2 },
];

// 默认奖励比例
export const DEFAULT_REWARD_RATE = 0.005; // 0.5%

// 默认佣金比例
export const DEFAULT_COMMISSION_RATE = 0.01; // 1%

// 任务超时时间（秒）
export const TASK_TIMEOUT = 300; // 5分钟

// 代收确认超时时间（秒）
export const PAYIN_CONFIRM_TIMEOUT = 180; // 3分钟

// 二维码有效期（秒）
export const QRCODE_EXPIRE_TIME = 300; // 5分钟
