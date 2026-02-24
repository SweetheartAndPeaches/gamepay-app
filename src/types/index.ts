// 用户类型
export interface User {
  id: string;
  phone: string;
  balance: string;
  frozenBalance: string;
  inviteCode: string;
  inviterId: string | null;
  googleAuthEnabled: boolean;
  status: string;
  createdAt: string;
  updatedAt: string | null;
}

// 收付款账户类型
export interface PaymentAccount {
  id: string;
  userId: string;
  accountType: 'wechat_qrcode' | 'alipay_qrcode' | 'alipay_account' | 'bank_card';
  accountInfo: Record<string, any>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
}

// 任务类型
export interface Task {
  id: string;
  merchantId: string;
  taskType: 'payout' | 'payin';
  orderNo: string;
  amount: string;
  rewardRatio: string;
  status: 'pending' | 'claimed' | 'completed' | 'cancelled' | 'timeout';
  claimedBy: string | null;
  claimedAt: string | null;
  completedAt: string | null;
  paymentInfo: Record<string, any> | null;
  expiredAt: string | null;
  createdAt: string;
  updatedAt: string | null;
}

// 子任务类型
export interface SubTask {
  id: string;
  taskId: string;
  subOrderNo: string;
  amount: string;
  paymentMethod: string;
  status: 'pending' | 'claimed' | 'confirmed' | 'cancelled';
  claimedBy: string | null;
  claimedAt: string | null;
  confirmedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
}

// 交易记录类型
export interface Transaction {
  id: string;
  userId: string;
  transactionType: 'task_reward' | 'commission' | 'withdrawal' | 'deposit' | 'freeze' | 'unfreeze';
  amount: string;
  balanceAfter: string;
  frozenAmount: string;
  relatedId: string | null;
  relatedType: string | null;
  remark: string | null;
  createdAt: string;
}

// 佣金记录类型
export interface Commission {
  id: string;
  agentId: string;
  referrerId: string | null;
  subUserId: string | null;
  taskId: string | null;
  subTaskId: string | null;
  commissionAmount: string;
  commissionType: 'payout' | 'payin';
  status: 'pending' | 'settled';
  createdAt: string;
}

// 代理关系类型
export interface AgentRelationship {
  id: string;
  agentId: string;
  referrerId: string | null;
  commissionRate: string;
  level: number;
  totalReferrals: number;
  status: 'active' | 'suspended';
  createdAt: string;
  updatedAt: string | null;
}

// 提现记录类型
export interface WithdrawalRecord {
  id: string;
  userId: string;
  amount: string;
  fee: string;
  actualAmount: string;
  bankAccountInfo: Record<string, any>;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  processedAt: string | null;
  remark: string | null;
  createdAt: string;
  updatedAt: string | null;
}

// 每日任务统计类型
export interface DailyTaskStat {
  id: string;
  userId: string;
  date: string;
  amountRange: string;
  completedCount: number;
  createdAt: string;
  updatedAt: string | null;
}

// 登录请求
export interface LoginRequest {
  phone: string;
  password: string;
  googleCode?: string;
}

// 注册请求
export interface RegisterRequest {
  phone: string;
  password: string;
  inviteCode?: string;
}

// API 响应
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}
