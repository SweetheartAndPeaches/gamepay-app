import { createClient, SupabaseClient } from '@supabase/supabase-js';

// 客户端 Supabase 配置（浏览器端使用）
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 验证环境变量
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env.local file:\n' +
    '  NEXT_PUBLIC_SUPABASE_URL=https://eplavqbtysmknzdcbgbq.supabase.co\n' +
    '  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here'
  );
}

// 创建 Supabase 客户端实例（客户端使用）
export const supabase = createClient(supabaseUrl!, supabaseAnonKey!, {
  db: {
    timeout: 60000,
  },
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
});

// 创建带认证的 Supabase 客户端（用于需要用户 token 的请求）
export function getSupabaseClient(token?: string): SupabaseClient {
  if (token) {
    return createClient(supabaseUrl!, supabaseAnonKey!, {
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
      db: {
        timeout: 60000,
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return supabase;
}

// 获取数据库连接字符串（服务端使用）
export function getDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    throw new Error(
      'Missing DATABASE_URL environment variable. Please check your .env.local file:\n' +
      '  DATABASE_URL=postgresql://postgres:password@db.eplavqbtysmknzdcbgbq.supabase.co:5432/postgres'
    );
  }
  
  return databaseUrl;
}

// 导出类型定义
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          phone: string;
          password_hash: string;
          invite_code: string;
          inviter_id: string | null;
          balance: number;
          frozen_balance: number;
          status: 'active' | 'inactive' | 'banned';
          google_auth_enabled: boolean;
          google_auth_secret: string | null;
          avatar_url: string | null;
          nickname: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          phone: string;
          password_hash: string;
          invite_code: string;
          inviter_id?: string | null;
          balance?: number;
          frozen_balance?: number;
          status?: 'active' | 'inactive' | 'banned';
          google_auth_enabled?: boolean;
          google_auth_secret?: string | null;
          avatar_url?: string | null;
          nickname?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          phone?: string;
          password_hash?: string;
          invite_code?: string;
          inviter_id?: string | null;
          balance?: number;
          frozen_balance?: number;
          status?: 'active' | 'inactive' | 'banned';
          google_auth_enabled?: boolean;
          google_auth_secret?: string | null;
          avatar_url?: string | null;
          nickname?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      agent_relationships: {
        Row: {
          id: string;
          agent_id: string;
          referrer_id: string;
          commission_rate: number;
          level: number;
          total_referrals: number;
          total_commission: number;
          status: 'active' | 'inactive';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          agent_id: string;
          referrer_id: string;
          commission_rate?: number;
          level?: number;
          total_referrals?: number;
          total_commission?: number;
          status?: 'active' | 'inactive';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          agent_id?: string;
          referrer_id?: string;
          commission_rate?: number;
          level?: number;
          total_referrals?: number;
          total_commission?: number;
          status?: 'active' | 'inactive';
          created_at?: string;
          updated_at?: string;
        };
      };
      balance_records: {
        Row: {
          id: string;
          user_id: string;
          type: 'task_reward' | 'commission' | 'withdrawal' | 'deposit' | 'freeze' | 'unfreeze';
          amount: number;
          balance_after: number;
          description: string | null;
          related_order_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: 'task_reward' | 'commission' | 'withdrawal' | 'deposit' | 'freeze' | 'unfreeze';
          amount: number;
          balance_after: number;
          description?: string | null;
          related_order_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: 'task_reward' | 'commission' | 'withdrawal' | 'deposit' | 'freeze' | 'unfreeze';
          amount?: number;
          balance_after?: number;
          description?: string | null;
          related_order_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          order_no: string;
          type: 'payout' | 'payin';
          amount: number;
          commission: number;
          status: 'pending' | 'claimed' | 'completed' | 'expired' | 'cancelled';
          payment_method: string | null;
          payment_account: string | null;
          payment_screenshot_url: string | null;
          task_completed_at: string | null;
          expires_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          order_no: string;
          type: 'payout' | 'payin';
          amount: number;
          commission?: number;
          status?: 'pending' | 'claimed' | 'completed' | 'expired' | 'cancelled';
          payment_method?: string | null;
          payment_account?: string | null;
          payment_screenshot_url?: string | null;
          task_completed_at?: string | null;
          expires_at: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          order_no?: string;
          type?: 'payout' | 'payin';
          amount?: number;
          commission?: number;
          status?: 'pending' | 'claimed' | 'completed' | 'expired' | 'cancelled';
          payment_method?: string | null;
          payment_account?: string | null;
          payment_screenshot_url?: string | null;
          task_completed_at?: string | null;
          expires_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      withdrawals: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          fee: number;
          actual_amount: number;
          type: 'wechat' | 'alipay' | 'bank' | 'paypal' | 'venmo' | 'cash_app' | 'zelle' | 'stripe' | 'wise' | 'payoneer' | 'swift';
          account_info: Record<string, any>;
          status: 'pending' | 'processing' | 'completed' | 'rejected';
          rejected_reason: string | null;
          processed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount: number;
          fee?: number;
          actual_amount: number;
          type: 'wechat' | 'alipay' | 'bank' | 'paypal' | 'venmo' | 'cash_app' | 'zelle' | 'stripe' | 'wise' | 'payoneer' | 'swift';
          account_info: Record<string, any>;
          status?: 'pending' | 'processing' | 'completed' | 'rejected';
          rejected_reason?: string | null;
          processed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          amount?: number;
          fee?: number;
          actual_amount?: number;
          type?: 'wechat' | 'alipay' | 'bank' | 'paypal' | 'venmo' | 'cash_app' | 'zelle' | 'stripe' | 'wise' | 'payoneer' | 'swift';
          account_info?: Record<string, any>;
          status?: 'pending' | 'processing' | 'completed' | 'rejected';
          rejected_reason?: string | null;
          processed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      bank_accounts: {
        Row: {
          id: string;
          user_id: string;
          type: 'wechat' | 'alipay' | 'bank' | 'paypal' | 'venmo' | 'cash_app' | 'zelle' | 'stripe' | 'wise' | 'payoneer' | 'swift';
          account_name: string;
          account_number: string;
          bank_name: string | null;
          bank_code: string | null;
          currency: string;
          is_default: boolean;
          status: 'active' | 'inactive';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: 'wechat' | 'alipay' | 'bank' | 'paypal' | 'venmo' | 'cash_app' | 'zelle' | 'stripe' | 'wise' | 'payoneer' | 'swift';
          account_name: string;
          account_number: string;
          bank_name?: string | null;
          bank_code?: string | null;
          currency?: string;
          is_default?: boolean;
          status?: 'active' | 'inactive';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: 'wechat' | 'alipay' | 'bank' | 'paypal' | 'venmo' | 'cash_app' | 'zelle' | 'stripe' | 'wise' | 'payoneer' | 'swift';
          account_name?: string;
          account_number?: string;
          bank_name?: string | null;
          bank_code?: string | null;
          currency?: string;
          is_default?: boolean;
          status?: 'active' | 'inactive';
          created_at?: string;
          updated_at?: string;
        };
      };
      system_settings: {
        Row: {
          key: string;
          value: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          key: string;
          value: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          key?: string;
          value?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};
