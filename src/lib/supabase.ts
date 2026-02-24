import { createClient } from '@supabase/supabase-js';

// TODO: 从环境变量中获取 Supabase 配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// 创建 Supabase 客户端实例
// 注意：如果没有配置正确的环境变量，这将创建一个无效的客户端
// 在实际使用前，请确保配置了正确的环境变量
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 导出类型定义
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          phone: string;
          inviteCode: string;
          isAgent: boolean;
          createdAt: string;
          updatedAt: string;
        };
        Insert: {
          id?: string;
          phone: string;
          inviteCode?: string;
          isAgent?: boolean;
          createdAt?: string;
          updatedAt?: string;
        };
        Update: {
          id?: string;
          phone?: string;
          inviteCode?: string;
          isAgent?: boolean;
          createdAt?: string;
          updatedAt?: string;
        };
      };
      balance_records: {
        Row: {
          id: string;
          userId: string;
          type: 'task_reward' | 'commission' | 'withdrawal' | 'deposit' | 'freeze' | 'unfreeze';
          amount: number;
          balanceAfter: number;
          description?: string;
          relatedOrderId?: string;
          createdAt: string;
          updatedAt: string;
        };
        Insert: {
          id?: string;
          userId: string;
          type: 'task_reward' | 'commission' | 'withdrawal' | 'deposit' | 'freeze' | 'unfreeze';
          amount: number;
          balanceAfter: number;
          description?: string;
          relatedOrderId?: string;
          createdAt?: string;
          updatedAt?: string;
        };
        Update: {
          id?: string;
          userId?: string;
          type?: 'task_reward' | 'commission' | 'withdrawal' | 'deposit' | 'freeze' | 'unfreeze';
          amount?: number;
          balanceAfter?: number;
          description?: string;
          relatedOrderId?: string;
          createdAt?: string;
          updatedAt?: string;
        };
      };
    };
  };
};
