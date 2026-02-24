# Task Wallet - 国际化支付平台

## 项目概述

Task Wallet 是一个支持多国语言的国际化支付平台，为用户提供代付、代收任务赚取手续费的服务。本项目采用 Next.js 16 + TypeScript 开发，支持 H5 混合应用模式，可嵌入到原生 App 中使用。

## 技术栈

- **框架**: Next.js 16 (App Router)
- **语言**: TypeScript 5
- **UI 组件**: shadcn/ui (基于 Radix UI)
- **样式**: Tailwind CSS 4
- **数据库**: Supabase (PostgreSQL)
- **对象存储**: S3 兼容存储
- **认证**: JWT + bcrypt
- **包管理器**: pnpm

## 已实现功能

### 1. 项目基础架构
- ✅ Next.js 项目初始化（使用 `coze init`）
- ✅ 数据库表结构设计（11 张核心表）
- ✅ Supabase 客户端集成
- ✅ 类型定义系统
- ✅ 密码加密和 JWT 认证
- ✅ 常量配置

### 2. 页面框架
- ✅ 底部导航栏（4 个 Tab）
- ✅ 余额显示组件
- ✅ 主布局组件

### 3. 核心页面
- ✅ 登录/注册页面 (`/`)
- ✅ 代付任务页面 (`/tasks/payout`)
- ✅ 代收任务页面 (`/tasks/payin`)
- ✅ 用户页面 - 我的 (`/profile`)
- ✅ 代理页面 (`/agent`)
- ✅ 收付款账户管理页面 (`/profile/accounts`)

### 4. API 接口
- ✅ POST `/api/auth/register` - 用户注册
- ✅ POST `/api/auth/login` - 用户登录
- ✅ GET `/api/user/info` - 获取用户信息
- ✅ GET `/api/profile/accounts` - 获取账户列表
- ✅ POST `/api/profile/accounts` - 添加账户
- ✅ PUT `/api/profile/accounts/:id` - 编辑账户
- ✅ DELETE `/api/profile/accounts/:id` - 删除账户

## 数据库表结构

### 核心表
- `users` - 用户表
- `payment_accounts` - 收付款账户表
- `merchants` - 商户表
- `tasks` - 任务表（代付/代收）
- `sub_tasks` - 代收子任务表
- `task_configs` - 任务配置表
- `agent_relationships` - 代理关系表
- `commissions` - 佣金记录表
- `transactions` - 交易记录表
- `withdrawal_records` - 提现记录表
- `daily_task_stats` - 每日任务统计表

## 待实现功能

### 1. 任务管理 API
- [ ] GET `/api/tasks/payout` - 获取代付任务列表
- [ ] POST `/api/tasks/payout/claim` - 领取代付任务
- [ ] POST `/api/tasks/payout/confirm` - 确认代付完成
- [ ] GET `/api/tasks/payin` - 获取代收任务列表
- [ ] POST `/api/tasks/payin/claim` - 领取代收任务
- [ ] POST `/api/tasks/payin/confirm` - 确认收款

### 2. 账户管理 API ✅
- [x] GET `/api/profile/accounts` - 获取账户列表
- [x] POST `/api/profile/accounts` - 添加账户
- [x] DELETE `/api/profile/accounts/:id` - 删除账户
- [x] PUT `/api/profile/accounts/:id` - 编辑账户

### 3. 安全设置 API
- [ ] POST `/api/profile/change-password` - 修改密码
- [ ] POST `/api/profile/bind-google` - 绑定谷歌验证
- [ ] POST `/api/profile/unbind-google` - 解绑谷歌验证

### 4. 余额管理 API
- [ ] GET `/api/profile/balance` - 余额明细
- [ ] POST `/api/profile/withdraw` - 申请提现
- [ ] GET `/api/profile/withdrawals` - 提现记录

### 5. 代理功能 API
- [ ] GET `/api/agent/info` - 代理信息
- [ ] GET `/api/agent/referrals` - 下级用户列表
- [ ] GET `/api/agent/commissions` - 佣金明细
- [ ] POST `/api/agent/share` - 生成推广链接

### 6. 支付功能集成
- [x] 二维码上传（收付款码）
- [ ] 二维码生成（收款码）
- [ ] 二维码识别（扫码功能）
- [ ] 微信支付集成
- [ ] 支付宝支付集成

### 7. 其他功能
- [ ] 任务配置管理
- [ ] 商户 API 接口
- [ ] 消息通知
- [ ] 管理后台

## 项目结构

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API 路由
│   │   └── auth/          # 认证相关 API
│   ├── tasks/             # 任务页面
│   ├── profile/           # 用户页面
│   ├── agent/             # 代理页面
│   └── page.tsx           # 首页（登录/注册）
├── components/            # React 组件
│   ├── ui/                # shadcn/ui 组件
│   ├── BottomNavigation.tsx
│   ├── BalanceHeader.tsx
│   ├── MainLayout.tsx
│   └── LanguageSelector.tsx  # 语言选择器
├── lib/                   # 工具函数
│   ├── crypto.ts          # 密码加密
│   ├── jwt.ts             # JWT 认证
│   ├── constants.ts       # 常量定义（包含国际支付方式）
│   └── utils.ts           # 通用工具
├── i18n/                  # 国际化配置
│   ├── zh-CN.json         # 简体中文
│   ├── en-US.json         # 英文
│   ├── ja-JP.json         # 日语
│   ├── ko-KR.json         # 韩语
│   ├── es-ES.json         # 西班牙语
│   ├── fr-FR.json         # 法语
│   ├── de-DE.json         # 德语
│   ├── config.ts          # 语言配置
│   ├── loader.ts          # 翻译加载器
│   └── context.tsx        # 国际化 Context
├── types/                 # TypeScript 类型定义
├── storage/               # 数据库和存储
│   └── database/
│       ├── shared/        # Schema 定义
│       └── supabase-client.ts
└── hooks/                 # React Hooks
```

## 国际化支持

### 支持的语言
- 🇨🇳 简体中文 (zh-CN)
- 🇺🇸 English (en-US)
- 🇯🇵 日本語 (ja-JP)
- 🇰🇷 한국어 (ko-KR)
- 🇪🇸 Español (es-ES)
- 🇫🇷 Français (fr-FR)
- 🇩🇪 Deutsch (de-DE)

### 支持的货币
- 🇨🇳 人民币 (CNY)
- 🇺🇸 美元 (USD)
- 🇯🇵 日元 (JPY)
- 🇰🇷 韩元 (KRW)
- 🇪🇺 欧元 (EUR)

### 支持的支付方式
#### 中国支付
- 微信二维码
- 支付宝二维码
- 支付宝账号
- 银行卡

#### 国际支付
- PayPal（全球）
- Venmo（美国）
- Cash App（美国）
- Zelle（美国）
- Stripe（全球）
- Wise（全球）
- Payoneer（全球）
- SWIFT 银行转账（全球）

### 使用方法

在组件中使用国际化：

```tsx
import { useI18n } from '@/i18n/context';

function MyComponent() {
  const { t, formatCurrency, locale, setLocale } = useI18n();

  return (
    <div>
      <p>{t('common.confirm')}</p>
      <p>{formatCurrency(100.50)}</p>
      <button onClick={() => setLocale('en-US')}>
        Switch to English
      </button>
    </div>
  );
}
```

## 开发命令

```bash
# 安装依赖
pnpm install

# 启动开发服务器（端口 5000）
pnpm dev

# 构建生产版本
pnpm build

# 启动生产服务器
pnpm start

# 类型检查
npx tsc --noEmit
```

## 环境变量配置

创建 `.env` 文件（参考 `.env.example`）：

```env
# 数据库配置
DATABASE_URL=your-database-url

# JWT 配置
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=7d

# 对象存储配置
COZE_BUCKET_ENDPOINT_URL=your-bucket-endpoint
COZE_BUCKET_NAME=your-bucket-name
```

## 部署说明

### 本地开发
项目已配置为在端口 5000 运行，支持 HMR（热模块替换）。

```bash
coze dev
```

### 生产环境（本地）
```bash
coze build
coze start
```

### Vercel 部署
项目已配置好 Vercel 部署，详细步骤请查看 [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)

**快速部署步骤：**

1. **获取 Supabase 配置**
   - 访问：https://supabase.com/dashboard/project/eplavqbtysmknzdcbgbq/settings/api
   - 复制 Project URL 和 anon public key

2. **在 Vercel 配置环境变量**
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://eplavqbtysmknzdcbgbq.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   DATABASE_URL=postgresql://postgres:7474+CxZ.52@db.eplavqbtysmknzdcbgbq.supabase.co:5432/postgres
   JWT_SECRET=生成一个强密码
   ```

3. **推送到 GitHub 并在 Vercel 导入项目**

详细配置请参考 [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)

## 注意事项

1. **安全性**
   - 生产环境必须修改 `JWT_SECRET`
   - 敏感信息使用环境变量管理
   - 密码使用 bcrypt 加密存储

2. **数据库**
   - 使用 Supabase 作为数据库
   - Schema 定义在 `src/storage/database/shared/schema.ts`
   - 修改 Schema 后运行 `coze-coding-ai db upgrade` 同步

3. **API 设计**
   - 使用 JWT Token 进行身份验证
   - 统一使用 `ApiResponse` 类型返回
   - 错误处理遵循 HTTP 状态码规范

4. **移动端适配**
   - 所有页面已适配移动端
   - 使用 shadcn/ui 组件库
   - 底部导航固定在屏幕底部

## 浏览器支持

- Chrome (推荐)
- Safari
- Firefox
- Edge

## License

MIT
