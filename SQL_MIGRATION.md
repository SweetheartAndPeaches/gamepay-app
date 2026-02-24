# SQL 文件整合说明

## 整合完成

所有 SQL 文件已成功整合成一个完整的初始化脚本：**supabase-complete.sql**

## 文件列表

### 当前使用的文件

- **supabase-complete.sql** (约 15 KB)
  - 完整的数据库初始化脚本
  - 包含所有表、触发器、索引和默认配置
  - 可直接在 Supabase SQL Editor 中执行
  - **注意**：已移除示例数据，需要手动插入测试数据

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

## 变更记录

### v2.0 (2026-02-24)
- 删除示例代收任务数据（因 user_id 不能为空）
- 添加测试数据插入说明
- 优化文档结构

### v1.0 (2026-02-24)
- 整合所有 SQL 文件为单个脚本
- 创建完整的数据库初始化流程

## 详细文档

请查看 `DATABASE_SETUP.md` 获取详细的数据库初始化指南。
