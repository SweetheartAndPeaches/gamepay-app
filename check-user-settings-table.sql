-- 测试：检查 user_settings 表是否存在
SELECT EXISTS (
   SELECT FROM information_schema.tables
   WHERE  table_schema = 'public'
   AND    table_name   = 'user_settings'
);

-- 如果不存在，执行以下创建语句
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  setting_type VARCHAR(20) NOT NULL CHECK (setting_type IN ('payin', 'payout')),
  enabled BOOLEAN DEFAULT false NOT NULL,
  max_amount DECIMAL(15, 2) DEFAULT 0 NOT NULL,
  daily_limit INTEGER DEFAULT 0 NOT NULL,
  auto_accept BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, setting_type)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_type ON user_settings(setting_type);
