# Vercel 部署配置检查清单

## ✅ 已完成的配置

- [x] Supabase 项目连接字符串配置
- [x] 数据库表结构设计
- [x] 环境变量模板创建
- [x] Vercel 部署文档编写
- [x] Supabase 配置说明文档编写
- [x] README 更新
- [x] 代码推送到 GitHub

## ⏳ 需要你完成的配置

### 1. 获取 Supabase 密钥（5 分钟）
- [ ] 访问：https://supabase.com/dashboard/project/eplavqbtysmknzdcbgbq/settings/api
- [ ] 复制 `anon public key`
- [ ] 复制 `service_role key`（如果需要）

### 2. 生成 JWT_SECRET（1 分钟）
```bash
openssl rand -base64 32
```
- [ ] 复制生成的密钥

### 3. 在 Supabase 创建数据库表（5 分钟）
- [ ] 打开 Supabase SQL Editor
- [ ] 执行 `SUPABASE_SETUP.md` 中的 SQL 脚本
- [ ] 验证表已创建

### 4. 配置本地环境（2 分钟）
- [ ] 编辑 `.env.local` 文件
- [ ] 填写 `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] 填写 `JWT_SECRET`
- [ ] 保存文件

### 5. 测试本地环境（2 分钟）
- [ ] 运行 `coze dev`
- [ ] 访问 http://localhost:5000
- [ ] 测试注册功能
- [ ] 检查 Supabase Dashboard 确认数据

### 6. 在 Vercel 配置环境变量（5 分钟）
- [ ] 访问 Vercel Dashboard
- [ ] 进入项目设置 -> Environment Variables
- [ ] 添加以下变量：
  - [ ] `NEXT_PUBLIC_SUPABASE_URL` = `https://eplavqbtysmknzdcbgbq.supabase.co`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` = *你的 anon key*
  - [ ] `DATABASE_URL` = `postgresql://postgres:7474+CxZ.52@db.eplavqbtysmknzdcbgbq.supabase.co:5432/postgres`
  - [ ] `JWT_SECRET` = *你生成的强密码*

### 7. 在 Vercel 部署（3 分钟）
- [ ] 在 Vercel 导入 GitHub 仓库
- [ ] 点击 Deploy 按钮
- [ ] 等待部署完成
- [ ] 访问部署的域名

### 8. 验证生产环境（2 分钟）
- [ ] 测试注册功能
- [ ] 测试登录功能
- [ ] 检查 Supabase 数据
- [ ] 查看 Vercel 日志

## 📋 Vercel 环境变量配置

在 Vercel 项目设置中，添加以下环境变量：

```bash
NEXT_PUBLIC_SUPABASE_URL=https://eplavqbtysmknzdcbgbq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
DATABASE_URL=postgresql://postgres:7474+CxZ.52@db.eplavqbtysmknzdcbgbq.supabase.co:5432/postgres
JWT_SECRET=your-jwt-secret-here
JWT_EXPIRES_IN=7d
```

## 🔑 获取信息的位置

### Supabase 配置
访问：https://supabase.com/dashboard/project/eplavqbtysmknzdcbgbq/settings/api

- **Project URL**: 已配置
- **API URL**: `https://eplavqbtysmknzdcbgbq.supabase.co`
- **anon public key**: 需要你获取
- **service_role key**: 需要你获取（可选）

### 数据库连接
- **Host**: `db.eplavqbtysmknzdcbgbq.supabase.co`
- **Port**: `5432`
- **Database**: `postgres`
- **User**: `postgres`
- **Password**: `7474+CxZ.52`

### Vercel 项目
访问：https://vercel.com/dashboard

- **GitHub 仓库**: `SweetheartAndPeaches/gamepay-app`
- **框架预设**: Next.js
- **Node 版本**: 24

## 📚 相关文档

- **Vercel 部署指南**: `VERCEL_DEPLOYMENT.md`
- **Supabase 配置说明**: `SUPABASE_SETUP.md`
- **项目 README**: `README.md`

## 🚀 快速开始

1. **获取 Supabase 密钥**（2 分钟）
   ```
   访问：https://supabase.com/dashboard/project/eplavqbtysmknzdcbgbq/settings/api
   复制 anon public key
   ```

2. **创建数据库表**（3 分钟）
   ```
   在 Supabase SQL Editor 执行 SUPABASE_SETUP.md 中的 SQL
   ```

3. **在 Vercel 部署**（5 分钟）
   ```
   1. 访问 https://vercel.com/dashboard
   2. 导入 GitHub 仓库 SweetheartAndPeaches/gamepay-app
   3. 添加环境变量（见上方列表）
   4. 点击 Deploy
   ```

## ⚠️ 重要提醒

1. **安全性**
   - 不要将 `.env.local` 提交到 Git
   - 不要在代码中硬编码密钥
   - 使用强密码作为 JWT_SECRET

2. **备份**
   - 定期备份 Supabase 数据库
   - 保存好环境变量配置

3. **监控**
   - 监控 Vercel 部署状态
   - 查看 Supabase 使用情况
   - 检查应用日志

## 🆘 遇到问题？

### Supabase 相关问题
- 文档: https://supabase.com/docs
- Dashboard: https://supabase.com/dashboard

### Vercel 相关问题
- 文档: https://vercel.com/docs
- Dashboard: https://vercel.com/dashboard

### 项目相关问题
- GitHub: https://github.com/SweetheartAndPeaches/gamepay-app/issues

## ✨ 完成后

配置完成后，你将拥有：
- ✅ 在 Vercel 部署的应用
- ✅ 连接到 Supabase 的数据库
- ✅ 支持多语言的国际化平台
- ✅ 完整的用户认证系统
- ✅ 代付/代收任务功能
- ✅ 代理推广功能
- ✅ 分享功能（复制链接、二维码）

预计总耗时：**15-20 分钟**
