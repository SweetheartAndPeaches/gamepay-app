export type TransactionType =
  | 'task_reward'
  | 'commission'
  | 'withdrawal'
  | 'deposit'
  | 'freeze'
  | 'unfreeze';

export interface BalanceRecord {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  balanceAfter: number;
  description?: string;
  relatedOrderId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BalanceStatistics {
  totalIncome: number;
  totalOutcome: number;
  availableBalance: number;
  frozenBalance: number;
}
