# Task Wallet 任务钱包

一个支持多国语言和国际支付方式的任务代付代收平台。

## 🌟 功能特性

- ✅ 多国语言支持（中文、英文、日语、韩语、西班牙语、法语、德语）
- ✅ 多货币支持（CNY, USD, JPY, KRW, EUR）
- ✅ 用户注册与登录
- ✅ 代理系统（邀请奖励）
- ✅ 余额管理（可用余额、冻结余额）
- ✅ 支付方式（微信、支付宝、银行卡、PayPal、Venmo、Cash App、Zelle、Stripe、Wise、Payoneer、SWIFT）

## 🚀 快速开始

### 前置要求

- Node.js 24+
- pnpm 包管理器
- Supabase 账户

### 环境配置

1. **克隆项目**
```bash
git clone <your-repo-url>
cd projects
```

2. **安装依赖**
```bash
pnpm install
```

3. **配置环境变量**

复制 `.env.example` 到 `.env.local`：
```bash
cp .env.example .env.local
```

编辑 `.env.local` 文件：
```env
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://eplavqbtysmknzdcbgbq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# 数据库连接字符串
DATABASE_URL=postgresql://postgres:password@db.eplavqbtysmknzdcbgbq.supabase.co:5432/postgres

# JWT 配置
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=7d
```

### 数据库初始化

**重要！登录功能需要先初始化数据库**

请按照 [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) 中的步骤操作：

1. 访问 Supabase Dashboard：https://supabase.com/dashboard/project/eplavqbtysmknzdcbgbq
2. 打开 SQL Editor
3. 执行 `supabase-init.sql` 中的 SQL 脚本
4. 验证表创建成功

详细说明请查看 [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)。

### 本地开发

启动开发服务器：
```bash
coze dev
```

访问 http://localhost:5000

## 📦 项目结构

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API 路由
│   │   └── auth/          # 认证相关 API
│   ├── layout.tsx         # 根布局
│   └── page.tsx           # 首页
├── components/            # React 组件
│   ├── ui/               # shadcn/ui 组件
│   └── ShareDialog.tsx   # 分享对话框
├── lib/                   # 工具库
│   ├── crypto.ts         # 加密工具
│   ├── jwt.ts            # JWT 工具
│   └── supabase.ts       # Supabase 客户端
├── storage/              # 存储服务
│   └── database/         # 数据库客户端
└── types/                # TypeScript 类型定义
```

## 🔧 技术栈

- **框架**: Next.js 16 (App Router)
- **语言**: TypeScript 5
- **UI**: React 19 + shadcn/ui
- **样式**: Tailwind CSS 4
- **数据库**: Supabase (PostgreSQL)
- **认证**: JWT + bcrypt
- **状态管理**: React Context
- **二维码**: qrcode

## 🌍 国际化

支持的语言：
- 🇨🇳 中文 (zh-CN)
- 🇺🇸 英文 (en-US)
- 🇯🇵 日语 (ja-JP)
- 🇰🇷 韩语 (ko-KR)
- 🇪🇸 西班牙语 (es-ES)
- 🇫🇷 法语 (fr-FR)
- 🇩🇪 德语 (de-DE)

支持的货币：
- CNY (人民币)
- USD (美元)
- JPY (日元)
- KRW (韩元)
- EUR (欧元)

## 💳 支付方式

### 中国
- 微信支付
- 支付宝
- 银行卡

### 国际
- PayPal
- Venmo
- Cash App
- Zelle
- Stripe
- Wise
- Payoneer
- SWIFT

## 📝 API 文档

### 认证 API

#### 注册
```
POST /api/auth/register
Content-Type: application/json

{
  "phone": "13800138000",
  "password": "123456",
  "inviteCode": "optional"
}
```

#### 登录
```
POST /api/auth/login
Content-Type: application/json

{
  "phone": "13800138000",
  "password": "123456",
  "googleCode": "optional"
}
```

### 用户 API

#### 获取用户信息
```
GET /api/user/info
Authorization: Bearer <token>
```

## 🚢 部署

### Vercel 部署

详细部署指南请查看 [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)。

### 环境变量

在 Vercel 项目设置中添加以下环境变量：

```
NEXT_PUBLIC_SUPABASE_URL=https://eplavqbtysmknzdcbgbq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
DATABASE_URL=postgresql://postgres:password@db.eplavqbtysmknzdcbgbq.supabase.co:5432/postgres
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=7d
```

## 📚 文档

- [Supabase 设置指南](./SUPABASE_SETUP.md)
- [Vercel 部署指南](./VERCEL_DEPLOYMENT.md)
- [部署检查清单](./DEPLOYMENT_CHECKLIST.md)

## 🔐 安全性

- 密码使用 bcrypt 加密
- JWT Token 认证
- HTTPS 加密传输
- SQL 注入防护（使用参数化查询）
- XSS 防护（React 自动转义）

## 🐛 问题排查

### 登录失败

**错误**: Could not find the 'balance' column of 'users' in the schema cache

**原因**: 数据库表还没有创建

**解决**: 按照 [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) 初始化数据库

### 其他问题

检查日志：
```bash
tail -n 50 /app/work/logs/bypass/app.log
```

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📧 联系方式

如有问题，请联系客服：400-888-8888（工作时间：9:00-18:00）

---

**注意**: 本项目仅供学习交流使用，请勿用于非法用途。
