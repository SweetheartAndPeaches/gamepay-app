# Supabase 数据库设置指南

## 问题诊断

登录失败的原因是数据库表还没有创建。错误信息：
```
Could not find the 'balance' column of 'users' in the schema cache
```

## 解决方案

### 步骤 1：访问 Supabase Dashboard

1. 打开浏览器，访问：https://supabase.com/dashboard/project/eplavqbtysmknzdcbgbq
2. 登录你的 Supabase 账户

### 步骤 2：打开 SQL Editor

1. 在左侧导航栏，点击 **SQL Editor**（图标看起来像一个数据库或代码块）
2. 点击 **New query** 按钮

### 步骤 3：执行初始化脚本

有两种方式：

#### 方式 A：复制粘贴（推荐）

1. 打开项目中的 `supabase-init.sql` 文件
2. 复制文件中的全部内容
3. 粘贴到 Supabase SQL Editor 中
4. 点击右下角的 **Run** 按钮
5. 等待执行完成（应该会显示 "Success"）

#### 方式 B：直接执行以下 SQL

```sql
-- ============================================
-- Task Wallet 数据库初始化脚本
-- ============================================

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. 用户表 (users)
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

CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_invite_code ON users(invite_code);
CREATE INDEX IF NOT EXISTS idx_users_inviter_id ON users(inviter_id);

-- 创建触发器自动更新 updated_at
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

-- 2. 代理关系表 (agent_relationships)
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

CREATE INDEX IF NOT EXISTS idx_agent_relationships_agent_id ON agent_relationships(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_relationships_referrer_id ON agent_relationships(referrer_id);
CREATE INDEX IF NOT EXISTS idx_agent_relationships_level ON agent_relationships(level);

CREATE TRIGGER update_agent_relationships_updated_at
  BEFORE UPDATE ON agent_relationships
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 3. 余额记录表 (balance_records)
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

CREATE INDEX IF NOT EXISTS idx_balance_records_user_id ON balance_records(user_id);
CREATE INDEX IF NOT EXISTS idx_balance_records_type ON balance_records(type);
CREATE INDEX IF NOT EXISTS idx_balance_records_created_at ON balance_records(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_balance_records_related_order_id ON balance_records(related_order_id);

CREATE TRIGGER update_balance_records_updated_at
  BEFORE UPDATE ON balance_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 4. 订单表 (orders)
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

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_type ON orders(type);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_order_no ON orders(order_no);
CREATE INDEX IF NOT EXISTS idx_orders_expires_at ON orders(expires_at);

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 5. 提现记录表 (withdrawals)
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

CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_created_at ON withdrawals(created_at DESC);

CREATE TRIGGER update_withdrawals_updated_at
  BEFORE UPDATE ON withdrawals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6. 银行账户表 (bank_accounts)
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

CREATE INDEX IF NOT EXISTS idx_bank_accounts_user_id ON bank_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_type ON bank_accounts(type);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_status ON bank_accounts(status);

CREATE TRIGGER update_bank_accounts_updated_at
  BEFORE UPDATE ON bank_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 7. 系统配置表 (system_settings)
CREATE TABLE IF NOT EXISTS system_settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON system_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 插入默认系统配置
INSERT INTO system_settings (key, value, description) VALUES
  ('payout.min_task_count', '5', '每日最低代付任务次数'),
  ('payout.reward_rate', '0.01', '代付任务奖励率（1%）'),
  ('payin.reward_rate', '0.015', '代收任务奖励率（1.5%）'),
  ('withdrawal.min_amount', '100', '最低提现金额'),
  ('withdrawal.fee_rate', '0.005', '提现手续费率（0.5%）'),
  ('agent.commission_rate', '0.05', '代理佣金率（5%）'),
  ('task.expire_minutes', '30', '任务过期时间（分钟）')
ON CONFLICT (key) DO NOTHING;
```

### 步骤 4：验证表创建

1. 在 Supabase Dashboard 左侧导航栏，点击 **Table Editor**
2. 你应该能看到以下表：
   - `users`（用户表）
   - `agent_relationships`（代理关系表）
   - `balance_records`（余额记录表）
   - `orders`（订单表）
   - `withdrawals`（提现记录表）
   - `bank_accounts`（银行账户表）
   - `system_settings`（系统配置表）

3. 点击 `users` 表，检查列是否包含：
   - `id` (UUID)
   - `phone` (VARCHAR)
   - `password_hash` (TEXT)
   - `invite_code` (VARCHAR)
   - `balance` (DECIMAL)
   - `frozen_balance` (DECIMAL)
   - `status` (VARCHAR)
   - 等等...

### 步骤 5：测试登录功能

1. 返回你的应用（http://localhost:5000）
2. 尝试注册一个新账号
3. 使用刚注册的账号登录

## 常见问题

### Q1: SQL 执行失败怎么办？

**A**: 检查错误信息：
- 如果是权限错误，确保你有足够的权限
- 如果是语法错误，复制粘贴时确保没有遗漏

### Q2: 如何删除所有表重新创建？

**A**: 在 SQL Editor 中执行：
```sql
DROP TABLE IF EXISTS withdrawals CASCADE;
DROP TABLE IF EXISTS bank_accounts CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS balance_records CASCADE;
DROP TABLE IF EXISTS agent_relationships CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
```
然后重新执行初始化脚本。

### Q3: 如何查看表数据？

**A**:
1. 在 Supabase Dashboard 点击 **Table Editor**
2. 选择要查看的表
3. 可以查看、插入、更新和删除数据

### Q4: 如何备份数据？

**A**:
1. 在 Supabase Dashboard 左侧导航栏，点击 **Database**
2. 找到 **Backups** 选项
3. Supabase 会自动创建备份

## 完成后的下一步

数据库初始化完成后：
1. ✅ 注册功能可以正常使用
2. ✅ 登录功能可以正常使用
3. ⏳ 需要实现任务系统（代付/代收任务）
4. ⏳ 需要实现提现功能
5. ⏳ 需要实现代理系统

## 获取帮助

如果遇到问题：
- 检查控制台日志：`tail -n 50 /app/work/logs/bypass/app.log`
- 检查 Supabase 错误信息
- 确保环境变量配置正确

## 技术支持

Supabase 文档：https://supabase.com/docs
项目仓库：请查看项目 README.md
