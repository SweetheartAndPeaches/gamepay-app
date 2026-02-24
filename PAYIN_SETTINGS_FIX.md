# 代收设置无法保存的解决方案

## 问题原因

代收设置无法保存是因为数据库中还没有创建 `user_settings` 表。

## 解决方法

### 步骤 1：访问 Supabase SQL Editor

1. 打开浏览器，访问：https://supabase.com/dashboard/project/eplavqbtysmknzdcbgbq
2. 登录你的 Supabase 账户
3. 在左侧导航栏，点击 **SQL Editor**
4. 点击 **New query** 按钮

### 步骤 2：执行 SQL 脚本

复制以下 SQL 脚本并在 SQL Editor 中执行：

```sql
-- ============================================
-- 创建用户设置表
-- ============================================

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

-- 添加触发器（如果还没有创建）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 步骤 3：验证表创建成功

1. 在 Supabase Dashboard 左侧导航栏，点击 **Table Editor**
2. 你应该能看到 `user_settings` 表
3. 点击表，查看列是否包含：
   - `id` (UUID)
   - `user_id` (UUID)
   - `setting_type` (VARCHAR)
   - `enabled` (BOOLEAN)
   - `max_amount` (DECIMAL)
   - `daily_limit` (INTEGER)
   - `auto_accept` (BOOLEAN)
   - `created_at` (TIMESTAMP)
   - `updated_at` (TIMESTAMP)

### 步骤 4：测试保存设置

1. 刷新应用页面
2. 进入"代收任务"页面
3. 点击"代收设置"按钮
4. 配置代收设置
5. 点击"保存设置"按钮
6. 应该能看到"设置保存成功"的提示

## 如果问题仍然存在

### 检查 1：查看浏览器控制台

1. 按 F12 打开浏览器开发者工具
2. 切换到 **Console** 标签
3. 点击"保存设置"
4. 查看是否有错误信息

### 检查 2：查看网络请求

1. 按 F12 打开浏览器开发者工具
2. 切换到 **Network** 标签
3. 点击"保存设置"
4. 找到 `payin-settings` 请求
5. 查看 **Response** 标签，看看返回了什么错误

### 检查 3：查看 Supabase 日志

1. 在 Supabase Dashboard 左侧导航栏，点击 **Logs**
2. 查看是否有错误日志
3. 记录错误信息并联系技术支持

## 常见错误

### 错误 1：relation "user_settings" does not exist

**原因**：数据库表还没有创建

**解决**：按照上述步骤 1-3 创建表

### 错误 2：column "max_amount" does not exist

**原因**：表结构不正确

**解决**：删除表并重新创建
```sql
DROP TABLE IF EXISTS user_settings CASCADE;
```
然后重新执行步骤 2 中的 SQL 脚本

### 错误 3：未授权访问 (401)

**原因**：Token 无效或已过期

**解决**：
1. 退出登录
2. 重新登录

### 错误 4：检查设置失败 (500)

**原因**：数据库连接问题或权限问题

**解决**：
1. 检查 Supabase 连接配置
2. 检查数据库权限设置

## SQL 脚本文件

你也可以在项目根目录找到以下 SQL 脚本文件：

- `supabase-init.sql` - 完整的数据库初始化脚本（包含 user_settings 表）
- `check-user-settings-table.sql` - 单独创建 user_settings 表的脚本

## 完整数据库初始化

如果你还没有初始化数据库，建议执行完整的初始化脚本：

1. 打开 Supabase SQL Editor
2. 执行 `supabase-init.sql` 文件中的所有内容
3. 这会创建所有必需的表：
   - users
   - agent_relationships
   - balance_records
   - orders
   - withdrawals
   - bank_accounts
   - system_settings
   - user_settings

## 联系支持

如果以上方法都无法解决问题，请：
1. 截图错误信息
2. 记录浏览器控制台的错误
3. 记录网络请求的响应
4. 联系技术支持

---

**注意**：执行 SQL 脚本时，请确保你在正确的项目和数据库中操作。
