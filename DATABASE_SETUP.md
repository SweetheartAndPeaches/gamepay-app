# Task Wallet 数据库初始化指南

## 快速开始

1. 在 Supabase Dashboard 中，进入 **SQL Editor**
2. 复制 `supabase-complete.sql` 文件的全部内容
3. 粘贴到 SQL Editor 中
4. 点击 **Run** 按钮执行

## 文件说明

### supabase-complete.sql

完整的数据库初始化脚本，包含：

- ✅ UUID 扩展
- ✅ 触发器函数
- ✅ 用户表 (users)
- ✅ 代理关系表 (agent_relationships)
- ✅ 余额记录表 (balance_records)
- ✅ 订单表 (orders)
- ✅ 提现记录表 (withdrawals)
- ✅ 银行账户表 (bank_accounts)
- ✅ 系统配置表 (system_settings)
- ✅ 收付款账户表 (payment_accounts)
  - 包含代收相关字段
- ✅ 代收任务分配表 (payin_task_allocations)
  - 包含 account_id 字段
- ✅ 默认系统配置

## 数据库表结构

### 用户相关

| 表名 | 说明 |
|------|------|
| users | 用户表 |
| agent_relationships | 代理关系表 |
| bank_accounts | 银行账户表 |
| payment_accounts | 收付款账户表 |

### 交易相关

| 表名 | 说明 |
|------|------|
| orders | 订单表 |
| withdrawals | 提现记录表 |
| balance_records | 余额记录表 |

### 代收任务相关

| 表名 | 说明 |
|------|------|
| payin_task_allocations | 代收任务分配表 |

### 系统配置

| 表名 | 说明 |
|------|------|
| system_settings | 系统配置表 |

## 验证表创建

执行完成后，在 Supabase Dashboard 左侧导航栏，点击 **Table Editor**，你应该能看到以下表：

- `users`
- `agent_relationships`
- `balance_records`
- `orders`
- `withdrawals`
- `bank_accounts`
- `system_settings`
- `payment_accounts`
- `payin_task_allocations`

## 系统配置说明

| key | 默认值 | 说明 |
|-----|--------|------|
| payout.min_task_count | 5 | 每日最低代付任务次数 |
| payout.reward_rate | 0.01 | 代付任务奖励率（1%） |
| payin.enabled | true | 代收任务是否开启 |
| payin.reward_rate | 0.015 | 代收任务奖励率（1.5%） |
| withdrawal.min_amount | 100 | 最低提现金额 |
| withdrawal.fee_rate | 0.005 | 提现手续费率（0.5%） |
| agent.commission_rate | 0.05 | 代理佣金率（5%） |
| task.expire_minutes | 30 | 任务过期时间（分钟） |

## 代收账户设置说明

### payment_accounts 表字段

| 字段名 | 类型 | 说明 |
|--------|------|------|
| payin_enabled | BOOLEAN | 是否启用该账户进行代收 |
| payin_max_amount | DECIMAL(15,2) | 该账户代收金额上限（0表示无限制） |
| payin_allocated_amount | DECIMAL(15,2) | 该账户已分配的代收金额 |
| payin_earned_commission | DECIMAL(15,2) | 该账户已获得的佣金总额 |
| payin_total_count | INTEGER | 该账户完成的代收任务总数 |

### 代收任务分配说明

1. **无限制模式**：所有账户 `payin_max_amount` 为 0，使用用户全部余额
2. **有限额模式**：计算所有启用账户的剩余金额之和，使用该值进行任务分配
3. **账户检查**：只显示启用代收且活跃状态的账户

## 插入测试数据（可选）

如果需要插入测试代收任务，请先创建测试用户，然后在 SQL Editor 中执行：

```sql
INSERT INTO payin_task_allocations (
  user_id,
  order_no,
  amount,
  commission,
  payment_method,
  payment_account_info,
  expires_at
) VALUES
(
  '你的用户ID',
  'PAYIN001',
  500.00,
  7.50,
  'wechat',
  '{"name": "张三", "account": "wx123456", "type": "微信"}',
  timezone('utc'::text, now()) + interval '30 minutes'
);
```

## 重新创建数据库

如果需要删除所有表重新创建，在 SQL Editor 中执行：

```sql
DROP TABLE IF EXISTS payin_task_allocations CASCADE;
DROP TABLE IF EXISTS payment_accounts CASCADE;
DROP TABLE IF EXISTS withdrawals CASCADE;
DROP TABLE IF EXISTS bank_accounts CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS balance_records CASCADE;
DROP TABLE IF EXISTS agent_relationships CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
```

然后重新执行 `supabase-complete.sql` 文件。

## 常见问题

### Q1: SQL 执行失败怎么办？

**A**: 检查错误信息：
- 如果是权限错误，确保你有足够的权限
- 如果是语法错误，复制粘贴时确保没有遗漏
- 如果是重复执行，会使用 `IF NOT EXISTS` 跳过已存在的表

### Q2: 如何查看表数据？

**A**:
1. 在 Supabase Dashboard 点击 **Table Editor**
2. 选择要查看的表
3. 可以查看、插入、更新和删除数据

### Q3: 如何备份数据？

**A**:
1. 在 Supabase Dashboard 左侧导航栏，点击 **Database**
2. 找到 **Backups** 选项
3. Supabase 会自动创建备份

### Q4: 如何修改系统配置？

**A**:

```sql
UPDATE system_settings SET value = '新值' WHERE key = '配置项key';
```

例如，开启代收任务：

```sql
UPDATE system_settings SET value = 'true' WHERE key = 'payin.enabled';
```
