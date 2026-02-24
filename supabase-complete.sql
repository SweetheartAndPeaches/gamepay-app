-- ============================================
-- Task Wallet 数据库完整初始化脚本
-- 在 Supabase SQL Editor 中执行此脚本
-- ============================================

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 触发器函数：自动更新 updated_at 字段
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

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

-- 添加触发器
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
-- 8. 收付款账户表 (payment_accounts)
-- ============================================
CREATE TABLE IF NOT EXISTS payment_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  account_type VARCHAR(50) NOT NULL CHECK (account_type IN ('wechat_qrcode', 'alipay_qrcode', 'alipay_account', 'bank_card')),
  account_info JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_payment_accounts_user_id ON payment_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_accounts_type ON payment_accounts(account_type);

-- 添加触发器
CREATE TRIGGER update_payment_accounts_updated_at
  BEFORE UPDATE ON payment_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 添加代收相关字段
ALTER TABLE payment_accounts
  ADD COLUMN IF NOT EXISTS payin_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS payin_max_amount DECIMAL(15, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS payin_allocated_amount DECIMAL(15, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS payin_earned_commission DECIMAL(15, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS payin_total_count INTEGER DEFAULT 0;

-- 添加注释
COMMENT ON COLUMN payment_accounts.payin_enabled IS '是否启用该账户进行代收';
COMMENT ON COLUMN payment_accounts.payin_max_amount IS '该账户代收金额上限（0表示无限制）';
COMMENT ON COLUMN payment_accounts.payin_allocated_amount IS '该账户已分配的代收金额';
COMMENT ON COLUMN payment_accounts.payin_earned_commission IS '该账户已获得的佣金总额';
COMMENT ON COLUMN payment_accounts.payin_total_count IS '该账户完成的代收任务总数';

-- ============================================
-- 9. 代收任务分配表 (payin_task_allocations)
-- ============================================
CREATE TABLE IF NOT EXISTS payin_task_allocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  order_no VARCHAR(50) UNIQUE NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  commission DECIMAL(15, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'claimed', 'completed', 'cancelled', 'timeout')),
  payment_method VARCHAR(50) NOT NULL,
  payment_account_info JSONB NOT NULL,
  transfer_proof_url TEXT,
  account_id UUID REFERENCES payment_accounts(id) ON DELETE SET NULL,
  claimed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_payin_task_allocations_user_id ON payin_task_allocations(user_id);
CREATE INDEX IF NOT EXISTS idx_payin_task_allocations_status ON payin_task_allocations(status);
CREATE INDEX IF NOT EXISTS idx_payin_task_allocations_expires_at ON payin_task_allocations(expires_at);
CREATE INDEX IF NOT EXISTS idx_payin_task_allocations_order_no ON payin_task_allocations(order_no);
CREATE INDEX IF NOT EXISTS idx_payin_task_allocations_account_id ON payin_task_allocations(account_id);

-- 添加触发器
CREATE TRIGGER update_payin_task_allocations_updated_at
  BEFORE UPDATE ON payin_task_allocations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 添加注释
COMMENT ON COLUMN payin_task_allocations.account_id IS '代收账户ID（关联 payment_accounts 表）';

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
-- 插入代收任务示例数据（可以从其他系统同步）
-- ============================================
INSERT INTO payin_task_allocations (
  user_id,
  order_no,
  amount,
  commission,
  payment_method,
  payment_account_info,
  expires_at
) VALUES
  (
    NULL, -- user_id 会在分配时设置
    'PAYIN001',
    500.00,
    7.50,
    'wechat',
    '{"name": "张三", "account": "wx123456", "type": "微信"}',
    timezone('utc'::text, now()) + interval '30 minutes'
  ),
  (
    NULL,
    'PAYIN002',
    800.00,
    12.00,
    'alipay',
    '{"name": "李四", "account": "ali123456", "type": "支付宝"}',
    timezone('utc'::text, now()) + interval '30 minutes'
  )
ON CONFLICT (order_no) DO NOTHING;

-- ============================================
-- 完成提示
-- ============================================
-- 所有表已成功创建
-- 可以开始使用 Task Wallet 应用
--
-- ============================================
-- 表结构说明
-- ============================================
--
-- 用户相关：
-- - users: 用户表
-- - agent_relationships: 代理关系表
-- - bank_accounts: 银行账户表
-- - payment_accounts: 收付款账户表
--
-- 交易相关：
-- - orders: 订单表
-- - withdrawals: 提现记录表
-- - balance_records: 余额记录表
--
-- 代收任务相关：
-- - payin_task_allocations: 代收任务分配表
--
-- 系统配置：
-- - system_settings: 系统配置表
--
-- ============================================
-- payment_account_info 字段结构示例：
-- ============================================
-- {
--   "name": "收款人姓名",
--   "account": "收款账号",
--   "type": "账户类型",
--   "bank": "开户银行" (可选),
--   "branch": "开户行" (可选)
-- }
--
-- ============================================
-- 代收账户设置说明
-- ============================================
-- payin_enabled:
--   - true: 启用该账户进行代收
--   - false: 禁用该账户进行代收
--
-- payin_max_amount:
--   - 0: 无限制，可以使用用户全部余额
--   - >0: 该账户最多只能接收此金额的代收任务
--
-- payin_allocated_amount:
--   - 已分配给该账户的代收金额
--   - 领取任务时增加，完成/取消时减少
--
-- payin_earned_commission:
--   - 该账户已获得的佣金总额
--   - 完成代收任务时增加
--
-- payin_total_count:
--   - 该账户完成的代收任务总数
--   - 完成代收任务时增加
