# Vercel 部署指南

## 准备工作

### 1. 获取 Supabase 配置

访问你的 Supabase 项目设置页面：
```
https://supabase.com/dashboard/project/eplavqbtysmknzdcbgbq/settings/api
```

获取以下信息：
- **Project URL**: `https://eplavqbtysmknzdcbgbq.supabase.co`
- **anon public key**: 在 "Project API keys" 部分

### 2. 设置数据库表

在 Supabase SQL Editor 中执行以下 SQL 创建表结构：

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

## 部署步骤

### 方法一：通过 Vercel Dashboard 部署

1. **推送到 GitHub**
   ```bash
   git add .
   git commit -m "配置 Supabase 和 Vercel 部署"
   git push origin main
   ```

2. **在 Vercel 导入项目**
   - 访问 https://vercel.com/dashboard
   - 点击 "Add New Project"
   - 选择 GitHub 仓库 `SweetheartAndPeaches/gamepay-app`
   - 点击 "Import"

3. **配置环境变量**
   在 Vercel 项目设置中添加以下环境变量：
   
   | 变量名 | 值 | 说明 |
   |--------|-----|------|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://eplavqbtysmknzdcbgbq.supabase.co` | Supabase 项目 URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 从 Supabase Dashboard 获取 | 匿名密钥 |
   | `DATABASE_URL` | `postgresql://postgres:7474+CxZ.52@db.eplavqbtysmknzdcbgbq.supabase.co:5432/postgres` | 数据库连接字符串 |
   | `JWT_SECRET` | 生成一个随机字符串 | JWT 密钥（建议使用强密码） |
   | `JWT_EXPIRES_IN` | `7d` | Token 过期时间 |

   生成 JWT_SECRET 的方法：
   ```bash
   openssl rand -base64 32
   ```

4. **部署**
   - 点击 "Deploy" 按钮
   - 等待部署完成（约 2-3 分钟）

### 方法二：通过 Vercel CLI 部署

1. **安装 Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **登录 Vercel**
   ```bash
   vercel login
   ```

3. **部署**
   ```bash
   vercel
   ```

4. **配置环境变量**
   访问 Vercel Dashboard -> 项目设置 -> Environment Variables，添加上述环境变量。

## 验证部署

1. 访问 Vercel 提供的域名
2. 检查应用是否正常运行
3. 测试注册功能是否连接到 Supabase
4. 查看浏览器控制台是否有错误

## 常见问题

### 1. 数据库连接失败
- 检查 `DATABASE_URL` 是否正确
- 确认 Supabase 数据库状态为 Active

### 2. Supabase 权限错误
- 确保 Row Level Security (RLS) 策略正确配置
- 检查 anon key 是否有效

### 3. 构建失败
- 检查环境变量是否正确配置
- 查看 Vercel 构建日志

### 4. 运行时错误
- 检查 Supabase 表结构是否正确
- 确认数据库迁移已执行

## 自定义域名（可选）

在 Vercel 项目设置中：
1. 进入 Domains 设置
2. 添加自定义域名
3. 按照 Vercel 提示配置 DNS

## 生产环境检查清单

- [ ] Supabase 项目 URL 和 anon key 已配置
- [ ] 数据库表已创建
- [ ] 环境变量已设置
- [ ] JWT_SECRET 已设置为强密码
- [ ] RLS 策略已配置（如果需要）
- [ ] 自定义域名已配置（可选）
- [ ] HTTPS 已启用（Vercel 默认启用）
- [ ] 构建成功且无错误
- [ ] 功能测试通过

## 监控和维护

- 在 Vercel Dashboard 监控部署状态
- 在 Supabase Dashboard 监控数据库性能
- 定期检查日志和错误报告
- 保持依赖项更新

## 联系支持

- Vercel 文档: https://vercel.com/docs
- Supabase 文档: https://supabase.com/docs
- GitHub Issues: https://github.com/SweetheartAndPeaches/gamepay-app/issues
