# Supabase 配置说明

## 已配置信息

### Supabase 项目信息
- **项目 ID**: `eplavqbtysmknzdcbgbq`
- **项目 URL**: `https://eplavqbtysmknzdcbgbq.supabase.co`
- **数据库地址**: `db.eplavqbtysmknzdcbgbq.supabase.co`
- **端口**: `5432`
- **数据库**: `postgres`
- **用户**: `postgres`

### 数据库连接字符串
```
postgresql://postgres:7474+CxZ.52@db.eplavqbtysmknzdcbgbq.supabase.co:5432/postgres
```

## 需要你手动操作的事项

### 1. 获取 Supabase Anon Key

访问以下地址获取 anon public key：
```
https://supabase.com/dashboard/project/eplavqbtysmknzdcbgbq/settings/api
```

在 "Project API Keys" 部分找到 `anon` `public` 密钥。

### 2. 在 Vercel 配置环境变量

在 Vercel 项目设置中添加以下环境变量：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://eplavqbtysmknzdcbgbq.supabase.co` | Supabase 项目 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | *从 Supabase Dashboard 获取* | 匿名密钥 |
| `DATABASE_URL` | `postgresql://postgres:7474+CxZ.52@db.eplavqbtysmknzdcbgbq.supabase.co:5432/postgres` | 数据库连接字符串 |
| `JWT_SECRET` | *生成一个强密码* | JWT 密钥 |

#### 生成 JWT_SECRET 的方法

在终端运行以下命令生成强密码：
```bash
openssl rand -base64 32
```

或者使用在线工具：
- https://generate-random.org/api-key-generator
- https://www.uuidgenerator.net/api/guid

### 3. 创建数据库表

在 Supabase SQL Editor 中执行以下 SQL 创建表：

```sql
-- 用户表
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone VARCHAR(20) UNIQUE NOT NULL,
  inviteCode VARCHAR(20) UNIQUE NOT NULL,
  isAgent BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 余额记录表
CREATE TABLE balance_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  amount DECIMAL(20, 4) NOT NULL,
  balanceAfter DECIMAL(20, 4) NOT NULL,
  description TEXT,
  relatedOrderId VARCHAR(100),
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_inviteCode ON users(inviteCode);
CREATE INDEX idx_balance_records_userId ON balance_records(userId);
CREATE INDEX idx_balance_records_type ON balance_records(type);
CREATE INDEX idx_balance_records_createdAt ON balance_records(createdAt);
```

## 本地开发配置

### .env.local 文件

项目根目录已创建 `.env.local` 文件，请手动填写 `NEXT_PUBLIC_SUPABASE_ANON_KEY`：

```env
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://eplavqbtysmknzdcbgbq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key-here  # 需要填写

# 数据库连接字符串
DATABASE_URL=postgresql://postgres:7474+CxZ.52@db.eplavqbtysmknzdcbgbq.supabase.co:5432/postgres

# JWT 配置
JWT_SECRET=your-jwt-secret-key-change-this-in-production  # 需要填写
JWT_EXPIRES_IN=7d

# 对象存储配置（暂时留空）
COZE_BUCKET_ENDPOINT_URL=your-bucket-endpoint
COZE_BUCKET_NAME=your-bucket-name
```

## 验证配置

### 1. 检查本地环境

运行开发服务器：
```bash
coze dev
```

访问 http://localhost:5000，检查应用是否正常运行。

### 2. 测试数据库连接

创建一个测试 API 路由 `src/app/api/test-db/route.ts`：

```typescript
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: '数据库连接成功',
      data
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: '数据库连接失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
```

访问 http://localhost:5000/api/test-db 测试连接。

### 3. 测试注册功能

1. 访问 http://localhost:5000
2. 尝试注册新用户
3. 在 Supabase Dashboard 的 Table Editor 中查看 `users` 表是否新增记录

## 常见问题

### 1. 连接超时
- 检查 Supabase 项目是否为 Active 状态
- 确认数据库 URL 正确
- 检查网络连接

### 2. 权限错误
- 确保 anon key 正确
- 检查 Row Level Security (RLS) 设置
- 确认表已创建

### 3. 构建错误
- 检查环境变量是否正确配置
- 确认依赖已正确安装

## 安全建议

1. **不要将敏感信息提交到 Git**
   - `.env.local` 已添加到 `.gitignore`
   - 永远不要在代码中硬编码密钥

2. **使用强密码**
   - JWT_SECRET 应该使用强随机字符串
   - 定期更换密钥

3. **启用 RLS**
   - 在 Supabase 中启用 Row Level Security
   - 配置适当的策略

4. **监控使用情况**
   - 定期检查 Supabase Dashboard
   - 监控数据库性能

## 下一步

1. ✅ 配置 Supabase 项目信息
2. ⏳ 获取 anon public key
3. ⏳ 在本地填写 .env.local
4. ⏳ 创建数据库表
5. ⏳ 在 Vercel 配置环境变量
6. ⏳ 部署到 Vercel
7. ⏳ 测试所有功能

## 参考链接

- Supabase Dashboard: https://supabase.com/dashboard/project/eplavqbtysmknzdcbgbq
- Supabase 文档: https://supabase.com/docs
- Vercel 部署指南: https://vercel.com/docs
- 项目 GitHub: https://github.com/SweetheartAndPeaches/gamepay-app
