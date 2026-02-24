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
