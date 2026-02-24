-- =============================================
-- Task Wallet - User Settings 表创建脚本
-- 复制此脚本到 Supabase SQL Editor 中执行
-- =============================================

-- 步骤 1：检查表是否存在
SELECT EXISTS (
   SELECT FROM information_schema.tables
   WHERE  table_schema = 'public'
   AND    table_name   = 'user_settings'
);

-- 步骤 2：如果上一步返回 false，执行以下语句创建表

-- 删除表（如果存在，仅用于测试环境，生产环境请谨慎使用）
-- DROP TABLE IF EXISTS user_settings CASCADE;

-- 创建 user_settings 表
CREATE TABLE IF NOT EXISTS user_settings (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    setting_type VARCHAR(50) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT false,
    max_amount DECIMAL(20, 2) NOT NULL DEFAULT 0,
    daily_limit INTEGER NOT NULL DEFAULT 0,
    auto_accept BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- 确保每个用户每种设置类型只有一条记录
    UNIQUE(user_id, setting_type)
);

-- 步骤 3：创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_type ON user_settings(setting_type);

-- 步骤 4：添加注释
COMMENT ON TABLE user_settings IS '用户设置表，用于存储代收、代付等配置';
COMMENT ON COLUMN user_settings.user_id IS '用户ID，关联 users 表';
COMMENT ON COLUMN user_settings.setting_type IS '设置类型：payin（代收）或 payout（代付）';
COMMENT ON COLUMN user_settings.enabled IS '是否启用该设置';
COMMENT ON COLUMN user_settings.max_amount IS '单笔最大金额限制';
COMMENT ON COLUMN user_settings.daily_limit IS '每日最大任务次数限制';
COMMENT ON COLUMN user_settings.auto_accept IS '是否自动接受任务';

-- 步骤 5：验证表创建成功
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'user_settings'
ORDER BY ordinal_position;

-- 步骤 6：测试插入数据（可选，可以跳过）
-- 注意：将下面的 1 替换为实际的用户ID
/*
INSERT INTO user_settings (user_id, setting_type, enabled, max_amount, daily_limit, auto_accept)
VALUES (1, 'payin', true, 1000.00, 10, true);
*/

-- 步骤 7：查询测试数据（可选，可以跳过）
/*
SELECT * FROM user_settings WHERE user_id = 1 AND setting_type = 'payin';
*/

-- 步骤 8：删除测试数据（可选，如果执行了步骤 6）
/*
DELETE FROM user_settings WHERE user_id = 1 AND setting_type = 'payin';
*/

-- =============================================
-- 完成提示
-- =============================================
-- 执行完成后，请确认：
-- 1. 步骤 1 返回 exists = true
-- 2. 步骤 5 显示了所有必要的列
-- 3. 回到应用中尝试保存设置
-- =============================================
