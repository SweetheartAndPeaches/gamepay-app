# 如何配置 Supabase SERVICE_ROLE_KEY

## 步骤 1：获取 SERVICE_ROLE_KEY

1. 打开 Supabase Dashboard: https://app.supabase.com
2. 选择你的项目
3. 进入 **Settings** → **API**
4. 在 **Project API keys** 部分找到 **service_role** (secret) 密钥
5. 点击复制按钮

⚠️ **重要提示**：
- SERVICE_ROLE_KEY 以 `eyJ` 开头（很长的字符串）
- 这是 **secret** 密钥，不要泄露给任何人
- 不要提交到 Git 或公开仓库

## 步骤 2：添加到环境变量

在 `/workspace/projects/.env.local` 文件中添加：

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://eplavqbtysmknzdcbgbq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwbGF2cWJ0eXNta256ZGNiZ2JxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MDI4ODMsImV4cCI6MjA4Mzk3ODg4M30.9a_IXWaZjLOp7LPQiCBLBeF2O5nGdsCVgw5CP5M7VLQ

# ⭐ 新增：服务端密钥（更高安全性）
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

将 `your-service-role-key-here` 替换为你在步骤 1 中复制的密钥。

## 步骤 3：验证配置

添加后，重启开发服务器以加载新的环境变量：

```bash
# 停止当前服务（Ctrl+C）
# 然后重新启动
coze dev
```

或者在浏览器刷新页面。

## 步骤 4：验证安全改进

刷新页面后，如果配置正确：
- ✅ 代码会自动使用 SERVICE_ROLE_KEY
- ✅ 控制台不会显示安全警告（生产环境）
- ✅ 功能正常工作

## 安全最佳实践

### ✅ 应该做的
1. ✅ 使用 SERVICE_ROLE_KEY 在服务端
2. ✅ 将 `.env.local` 添加到 `.gitignore`
3. ✅ 定期轮换密钥（每 3-6 个月）
4. ✅ 限制密钥访问范围（如果可能）
5. ✅ 监控 API 使用情况

### ❌ 不应该做的
1. ❌ 不要将 SERVICE_ROLE_KEY 提交到 Git
2. ❌ 不要在前端代码中使用 SERVICE_ROLE_KEY
3. ❌ 不要在公开的文档中泄露密钥
4. ❌ 不要将密钥硬编码在代码中
5. ❌ 不要在日志中打印密钥

## 环境变量说明

### ANON_KEY（公开密钥）
- **用途**：前端直接访问 Supabase
- **权限**：受 RLS 限制
- **安全性**：可以公开，但有限制
- **位置**：`NEXT_PUBLIC_` 前缀，可以暴露给浏览器

### SERVICE_ROLE_KEY（服务端密钥）
- **用途**：服务端完全访问
- **权限**：绕过 RLS，完全控制
- **安全性**：绝不能泄露
- **位置**：无 `NEXT_PUBLIC_` 前缀，只在服务端可用

## 当前实现的安全性

### 配置 SERVICE_ROLE_KEY 后
- ✅ **高安全性**：使用服务端密钥
- ✅ **绕过 RLS**：在服务端逻辑中控制数据访问
- ✅ **更好的隔离**：密钥不暴露给前端
- ✅ **符合最佳实践**：服务端使用服务端密钥

### 不配置 SERVICE_ROLE_KEY（降级方案）
- ⚠️ **中等安全性**：使用 ANON_KEY
- ⚠️ **功能正常**：API 仍然有 JWT 验证
- ⚠️ **密钥风险**：ANON_KEY 设计就是公开的
- ⚠️ **警告提示**：生产环境会显示警告

## 紧急情况处理

如果密钥泄露：
1. 立即在 Supabase Dashboard 轮换密钥
2. 更新环境变量
3. 重启服务
4. 检查是否有异常访问日志
