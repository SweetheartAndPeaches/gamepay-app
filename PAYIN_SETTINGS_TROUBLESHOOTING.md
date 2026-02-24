# 代收设置保存问题故障排查指南

## 问题症状
在保存代收设置时，出现错误提示或无法保存。

## 故障排查步骤

### 1. 运行诊断工具

登录系统后，访问 `/tasks/payin/settings` 页面，点击"运行诊断"按钮。

查看诊断结果，特别注意以下信息：
- `tables.user_settings` 是否存在
- 是否有任何错误消息

### 2. 检查数据库表

#### 方式一：通过 Supabase Dashboard
1. 登录 [Supabase Dashboard](https://app.supabase.com/)
2. 进入你的项目
3. 点击左侧菜单的 "SQL Editor"
4. 点击 "New query"
5. 执行以下 SQL 语句检查表是否存在：

```sql
SELECT EXISTS (
   SELECT FROM information_schema.tables
   WHERE  table_schema = 'public'
   AND    table_name   = 'user_settings'
);
```

如果返回 `exists = false`，则需要创建表。

#### 方式二：通过诊断 API
如果诊断 API 显示 `user_settings` 不存在，则需要创建表。

### 3. 创建 user_settings 表

#### 步骤 1：检查表是否已存在
在 Supabase SQL Editor 中执行：

```sql
SELECT * FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'user_settings';
```

#### 步骤 2：如果表不存在，执行以下 SQL 创建表

```sql
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

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_type ON user_settings(setting_type);

-- 添加注释
COMMENT ON TABLE user_settings IS '用户设置表，用于存储代收、代付等配置';
COMMENT ON COLUMN user_settings.user_id IS '用户ID，关联 users 表';
COMMENT ON COLUMN user_settings.setting_type IS '设置类型：payin（代收）或 payout（代付）';
COMMENT ON COLUMN user_settings.enabled IS '是否启用该设置';
COMMENT ON COLUMN user_settings.max_amount IS '单笔最大金额限制';
COMMENT ON COLUMN user_settings.daily_limit IS '每日最大任务次数限制';
COMMENT ON COLUMN user_settings.auto_accept IS '是否自动接受任务';
```

### 4. 验证表创建成功

执行以下 SQL 查询：

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'user_settings'
ORDER BY ordinal_position;
```

应该看到以下列：
- id
- user_id
- setting_type
- enabled
- max_amount
- daily_limit
- auto_accept
- created_at
- updated_at

### 5. 测试表功能

在 Supabase SQL Editor 中执行以下测试：

```sql
-- 插入测试数据（使用你的用户ID，替换 YOUR_USER_ID）
INSERT INTO user_settings (user_id, setting_type, enabled, max_amount, daily_limit, auto_accept)
VALUES (1, 'payin', true, 1000.00, 10, true);

-- 查询测试数据
SELECT * FROM user_settings WHERE user_id = 1 AND setting_type = 'payin';

-- 删除测试数据
DELETE FROM user_settings WHERE user_id = 1 AND setting_type = 'payin';
```

### 6. 检查环境变量

确保在 `.env.local` 文件中正确配置了 Supabase 环境变量：

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 7. 检查浏览器控制台

打开浏览器开发者工具（F12），查看 Console 标签：
- 查看是否有 JavaScript 错误
- 查看网络请求的详细响应

### 8. 查看服务器日志

查看日志文件：
```bash
tail -n 50 /app/work/logs/bypass/app.log
```

### 9. 测试 API 端点

使用 Postman 或 curl 测试 API：

```bash
# 获取设置
curl -X GET \
  http://localhost:5000/api/user/payin-settings \
  -H 'Authorization: Bearer YOUR_TOKEN'

# 保存设置
curl -X POST \
  http://localhost:5000/api/user/payin-settings \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "enabled": true,
    "maxAmount": 1000,
    "dailyLimit": 10,
    "autoAccept": true
  }'
```

### 10. 检查 Row Level Security (RLS) 策略

如果表存在但仍有权限问题，检查 RLS 策略：

```sql
-- 查看当前 RLS 策略
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'user_settings';
```

如果需要，添加 RLS 策略：

```sql
-- 启用 RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- 允许用户读取自己的设置
CREATE POLICY "Users can view own settings"
ON user_settings
FOR SELECT
USING (auth.uid() = user_id::bigint);

-- 允许用户插入自己的设置
CREATE POLICY "Users can insert own settings"
ON user_settings
FOR INSERT
WITH CHECK (auth.uid() = user_id::bigint);

-- 允许用户更新自己的设置
CREATE POLICY "Users can update own settings"
ON user_settings
FOR UPDATE
USING (auth.uid() = user_id::bigint);

-- 允许服务端通过 service_role key 完全访问（可选）
CREATE POLICY "Service role can manage all settings"
ON user_settings
FOR ALL
USING (auth.role() = 'service_role');
```

## 常见错误及解决方案

### 错误 1: "table user_settings does not exist"
**原因**：表未创建
**解决方案**：按照步骤 3 创建表

### 错误 2: "permission denied for table user_settings"
**原因**：权限不足或 RLS 策略阻止
**解决方案**：
1. 检查环境变量中的 anon_key 是否正确
2. 按照步骤 10 添加或修改 RLS 策略

### 错误 3: "null value in column "user_id" violates not-null constraint"
**原因**：用户 ID 未正确传递
**解决方案**：检查 token 验证逻辑，确保 token 包含有效的 userId

### 错误 4: "duplicate key value violates unique constraint"
**原因**：尝试插入重复的用户设置
**解决方案**：API 已经处理了这种情况（先检查是否存在，再决定更新或插入）

## 联系支持

如果以上步骤都无法解决问题，请提供以下信息：
1. 诊断工具的完整输出
2. 浏览器控制台的错误信息
3. 服务器日志（/app/work/logs/bypass/app.log）
4. Supabase SQL Editor 中的错误信息
