# SQL 文件整合说明

## 整合完成

所有 SQL 文件已成功整合成一个完整的初始化脚本：**supabase-complete.sql**

## 文件列表

### 当前使用的文件

- **supabase-complete.sql** (16.2 KB)
  - 完整的数据库初始化脚本
  - 包含所有表、触发器、索引和默认数据
  - 可直接在 Supabase SQL Editor 中执行

### 已备份的文件（仅作参考）

以下文件已备份到 `sql-backup/` 目录，**不再使用**：

- supabase-init.sql
- supabase-payin-account-settings.sql
- supabase-payin-allocations.sql
- supabase-payin-task-account-id.sql
- supabase-payment-accounts-payin.sql

## 使用说明

1. 打开 `supabase-complete.sql` 文件
2. 复制全部内容
3. 在 Supabase SQL Editor 中粘贴
4. 点击 Run 执行

## 详细文档

请查看 `DATABASE_SETUP.md` 获取详细的数据库初始化指南。
