-- ============================================
-- Task Wallet 数据库初始化脚本
-- 在 Supabase SQL Editor 中执行此脚本
-- ============================================

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. 用户表 (users)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(20) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  invite_code VARCHAR(20) UNIQUE NOT NULL,
  inviter_id UUID REFERENCES users(id) ON DELETE SET NULL,
  balance DECIMAL(15, 2) DEFAULT 0.00 NOT NULL,
  frozen_balance DECIMAL(15, 2) DEFAULT 0.00 NOT NULL,
  status VARCHAR(20) DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'inactive', 'banned')),
  google_auth_enabled BOOLEAN DEFAULT false,
  google_auth_secret TEXT,
  avatar_url TEXT,
  nickname VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_invite_code ON users(invite_code);
CREATE INDEX IF NOT EXISTS idx_users_inviter_id ON users(inviter_id);

-- 添加触发器自动更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 2. 代理关系表 (agent_relationships)
-- ============================================
CREATE TABLE IF NOT EXISTS agent_relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  referrer_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  commission_rate DECIMAL(5, 2) DEFAULT 5.00 NOT NULL,
  level INTEGER DEFAULT 1 NOT NULL,
  total_referrals INTEGER DEFAULT 0 NOT NULL,
  total_commission DECIMAL(15, 2) DEFAULT 0.00 NOT NULL,
  status VARCHAR(20) DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(agent_id, referrer_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_agent_relationships_agent_id ON agent_relationships(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_relationships_referrer_id ON agent_relationships(referrer_id);
CREATE INDEX IF NOT EXISTS idx_agent_relationships_level ON agent_relationships(level);

-- 添加触发器
CREATE TRIGGER update_agent_relationships_updated_at
  BEFORE UPDATE ON agent_relationships
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 3. 余额记录表 (balance_records)
-- ============================================
CREATE TABLE IF NOT EXISTS balance_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('task_reward', 'commission', 'withdrawal', 'deposit', 'freeze', 'unfreeze')),
  amount DECIMAL(15, 2) NOT NULL,
  balance_after DECIMAL(15, 2) NOT NULL,
  description TEXT,
  related_order_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_balance_records_user_id ON balance_records(user_id);
CREATE INDEX IF NOT EXISTS idx_balance_records_type ON balance_records(type);
CREATE INDEX IF NOT EXISTS idx_balance_records_created_at ON balance_records(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_balance_records_related_order_id ON balance_records(related_order_id);

-- 添加触发器
CREATE TRIGGER update_balance_records_updated_at
  BEFORE UPDATE ON balance_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. 订单表 (orders)
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  order_no VARCHAR(50) UNIQUE NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('payout', 'payin')),
  amount DECIMAL(15, 2) NOT NULL,
  commission DECIMAL(15, 2) DEFAULT 0.00 NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'claimed', 'completed', 'expired', 'cancelled')),
  payment_method VARCHAR(50),
  payment_account TEXT,
  payment_screenshot_url TEXT,
  task_completed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_type ON orders(type);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_order_no ON orders(order_no);
CREATE INDEX IF NOT EXISTS idx_orders_expires_at ON orders(expires_at);

-- 添加触发器
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. 提现记录表 (withdrawals)
-- ============================================
CREATE TABLE IF NOT EXISTS withdrawals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  fee DECIMAL(15, 2) DEFAULT 0.00 NOT NULL,
  actual_amount DECIMAL(15, 2) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('wechat', 'alipay', 'bank', 'paypal', 'venmo', 'cash_app', 'zelle', 'stripe', 'wise', 'payoneer', 'swift')),
  account_info JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
  rejected_reason TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_created_at ON withdrawals(created_at DESC);

-- 添加触发器
CREATE TRIGGER update_withdrawals_updated_at
  BEFORE UPDATE ON withdrawals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. 银行账户表 (bank_accounts)
-- ============================================
CREATE TABLE IF NOT EXISTS bank_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('wechat', 'alipay', 'bank', 'paypal', 'venmo', 'cash_app', 'zelle', 'stripe', 'wise', 'payoneer', 'swift')),
  account_name VARCHAR(100) NOT NULL,
  account_number TEXT NOT NULL,
  bank_name VARCHAR(100),
  bank_code VARCHAR(20),
  currency VARCHAR(10) DEFAULT 'CNY',
  is_default BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, account_number, type)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_bank_accounts_user_id ON bank_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_type ON bank_accounts(type);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_status ON bank_accounts(status);

-- 添加触发器
CREATE TRIGGER update_bank_accounts_updated_at
  BEFORE UPDATE ON bank_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7. 系统配置表 (system_settings)
-- ============================================
CREATE TABLE IF NOT EXISTS system_settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 添加触发器
CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON system_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 插入默认系统配置
-- ============================================
INSERT INTO system_settings (key, value, description) VALUES
  ('payout.min_task_count', '5', '每日最低代付任务次数'),
  ('payout.reward_rate', '0.01', '代付任务奖励率（1%）'),
  ('payin.enabled', 'true', '代收任务是否开启'),
  ('payin.reward_rate', '0.015', '代收任务奖励率（1.5%）'),
  ('withdrawal.min_amount', '100', '最低提现金额'),
  ('withdrawal.fee_rate', '0.005', '提现手续费率（0.5%）'),
  ('agent.commission_rate', '0.05', '代理佣金率（5%）'),
  ('task.expire_minutes', '30', '任务过期时间（分钟）')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- 完成提示
-- ============================================
-- 所有表已成功创建
-- 可以开始使用 Task Wallet 应用
