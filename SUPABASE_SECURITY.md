# Supabase REST API 安全配置

## 当前问题

当前实现使用了 `NEXT_PUBLIC_SUPABASE_ANON_KEY`，这个密钥是公开的，存在安全隐患：

1. **密钥泄露风险**：ANON_KEY 可以在前端代码中访问
2. **绕过后端验证**：攻击者可以直接调用 Supabase REST API
3. **缺少数据隔离**：没有 Row Level Security (RLS) 保护

## 推荐解决方案

### 方案 1：使用 SERVICE_ROLE_KEY（强烈推荐）

服务端应使用 `SERVICE_ROLE_KEY`，它：
- ✅ 绕过 Row Level Security
- ✅ 拥有完全权限
- ✅ 只能在服务端使用
- ✅ 不应该暴露给前端

**配置步骤：**

1. 在 Supabase Dashboard 获取 SERVICE_ROLE_KEY
   - 项目设置 → API → service_role (secret)

2. 添加到环境变量（不要提交到 git）
   ```bash
   # .env.local
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```

3. 修改代码使用 SERVICE_ROLE_KEY
   ```typescript
   // src/storage/database/supabase-rest.ts
   function getConfig(): SupabaseConfig {
     const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
     const apiKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // 使用 service role key

     if (!url) {
       throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set');
     }

     if (!apiKey) {
       throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
     }

     return { url, apiKey };
   }
   ```

### 方案 2：启用 Row Level Security (RLS)

如果必须使用 ANON_KEY，必须启用 RLS：

```sql
-- 启用 RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE balance_records ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略

-- 用户只能查看自己的订单
CREATE POLICY "Users can view their own orders"
ON orders FOR SELECT
USING (auth.uid()::text = user_id);

-- 用户只能更新自己的订单
CREATE POLICY "Users can update their own orders"
ON orders FOR UPDATE
USING (auth.uid()::text = user_id);

-- 管理员可以查看所有订单（如果需要）
CREATE POLICY "Admins can view all orders"
ON orders FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()::text
    AND is_admin = true
  )
);
```

**但是**：当前实现使用自定义 JWT（不是 Supabase Auth），`auth.uid()` 会返回 `null`，所以 RLS 无法工作。

### 方案 3：使用 Supabase Edge Functions（最佳实践）

创建 Supabase Edge Functions 作为中间层：

```typescript
// supabase/functions/get-orders/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  // 验证自定义 JWT
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  const payload = verifyToken(token);

  if (!payload) {
    return new Response('Unauthorized', { status: 401 });
  }

  // 使用 Supabase 客户端
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', payload.userId);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ data }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

## 当前实现的安全性评估

### ✅ 安全的部分
1. API 路由有 JWT 验证
2. 使用 HTTPS（Supabase 默认）
3. Token 有过期时间

### ⚠️ 需要改进的部分
1. 使用了 ANON_KEY 而不是 SERVICE_ROLE_KEY
2. 没有 RLS 保护
3. 服务端密钥存储在环境变量中（这是正确的）

## 建议的行动计划

### 立即执行（高优先级）
1. ✅ 使用 SERVICE_ROLE_KEY 替代 ANON_KEY
2. ✅ 确保 SERVICE_ROLE_KEY 只在服务端使用
3. ✅ 定期轮换 SERVICE_ROLE_KEY

### 中期改进（中优先级）
1. 添加 API 速率限制
2. 添加 IP 白名单（如果可能）
3. 实现审计日志

### 长期优化（低优先级）
1. 迁移到 Supabase Edge Functions
2. 实现更细粒度的权限控制
3. 添加数据加密

## 总结

**当前实现对于 MVP 阶段是可接受的**，因为：
- API 路由有 JWT 验证保护
- 攻击者需要有效的 JWT 才能访问数据
- 但是密钥本身泄露是一个潜在风险

**生产环境必须使用 SERVICE_ROLE_KEY**，原因：
- 避免密钥泄露风险
- 提供更好的安全隔离
- 符合最佳实践
