# 代收设置问题快速解决方案

## 问题诊断

你遇到的问题很可能是：**数据库中没有 `user_settings` 表**。

## 快速解决步骤（5 分钟）

### 步骤 1：运行诊断（1 分钟）

1. 登录系统
2. 访问：http://localhost:5000/tasks/payin/settings
3. 点击"运行诊断"按钮
4. 查看诊断结果

如果 `tables.user_settings` 显示 `exists: false` 或有错误，请执行步骤 2。

### 步骤 2：在 Supabase 中创建表（3 分钟）

1. 打开 Supabase SQL Editor：https://supabase.com/dashboard/project/eplavqbtysmknzdcbgbq/sql

2. 复制以下 SQL 脚本：

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
    UNIQUE(user_id, setting_type)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_type ON user_settings(setting_type);

-- 添加注释
COMMENT ON TABLE user_settings IS '用户设置表，用于存储代收、代付等配置';
```

3. 点击"Run"执行

4. 验证表创建成功，执行：

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'user_settings'
ORDER BY ordinal_position;
```

应该看到所有列已创建。

### 步骤 3：测试功能（1 分钟）

1. 回到应用：http://localhost:5000/tasks/payin/settings
2. 点击"运行诊断"
3. 确认 `tables.user_settings` 显示 `exists: true`
4. 修改设置并点击"保存"
5. 应该看到"代收设置保存成功"的提示

## 如果仍然失败

### 检查环境变量

确认 `.env.local` 文件中包含：

```env
NEXT_PUBLIC_SUPABASE_URL=https://eplavqbtysmknzdcbgbq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 查看详细日志

打开浏览器开发者工具（F12）：
1. 点击 Console 标签
2. 查看是否有错误信息
3. 点击 Network 标签
4. 找到 `payin-settings` 请求
5. 查看响应内容

### 联系支持

如果以上步骤都无法解决，请提供：
1. 诊断工具的完整输出
2. 浏览器控制台的错误截图
3. Supabase SQL Editor 中的错误信息

## 参考文档

- [完整故障排查指南](./PAYIN_SETTINGS_TROUBLESHOOTING.md)
- [SQL 脚本文件](./create-user-settings-table.sql)
- [数据库初始化指南](./SUPABASE_SETUP.md)
