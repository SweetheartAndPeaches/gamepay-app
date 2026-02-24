# 代收任务自动分配模式说明

## 功能概述

代收任务采用**系统自动分配**模式，用户无需手动领取任务。系统会根据用户的设置自动匹配并分配任务。

## 核心流程

### 1. 用户设置代收规则

用户在"代收任务"页面点击"代收设置"按钮，配置以下参数：

- **开启代收功能**：是否接收代收任务
- **单次最高金额**：单次接收的代收任务最大金额（0 表示不限制）
- **每日限制单数**：每日最多接收的代收任务数量（0 表示不限制）
- **自动接受任务**：是否自动接受系统分配的任务

### 2. 设置代收账户

用户必须在"我的 > 账户管理 > 代收账户"中添加代收账户：
- 微信二维码
- 支付宝二维码
- 支付宝账号
- 银行卡

### 3. 系统自动分配任务

系统会根据以下条件自动分配任务：

1. 用户已开启代收功能
2. 用户余额充足（大于或等于代收金额）
3. 任务金额不超过用户设置的单次最高金额
4. 今日接收次数未超过每日限制
5. 用户没有未完成的代收任务

### 4. 任务分配流程

1. 系统在任务池中查找符合条件的任务
2. 匹配用户的代收账户
3. 自动冻结对应的余额
4. 将任务分配给用户
5. 用户在"代收任务"页面看到已分配的任务

### 5. 完成代收

用户完成代收后，点击"确认已收到款项"：
- 冻结余额减少（解冻）
- 可用余额增加（代收金额返还）
- 可用余额增加（佣金奖励）

## API 路由

### GET /api/tasks/payin/assigned

获取用户已分配的代收任务列表。

**响应示例：**
```json
{
  "success": true,
  "message": "获取任务列表成功",
  "data": {
    "enabled": true,
    "userEnabled": true,
    "userBalance": 1000,
    "userSettings": {
      "enabled": true,
      "max_amount": 500,
      "daily_limit": 10,
      "auto_accept": true
    },
    "tasks": [
      {
        "id": "uuid",
        "order_no": "PAYIN001",
        "amount": 500,
        "commission": 7.5,
        "status": "claimed",
        "payment_method": "wechat",
        "expires_at": "2026-02-24T12:00:00Z"
      }
    ],
    "accounts": [...]
  }
}
```

### GET /api/user/payin-settings

获取用户的代收设置。

**响应示例：**
```json
{
  "success": true,
  "message": "获取代收设置成功",
  "data": {
    "enabled": true,
    "max_amount": 500,
    "daily_limit": 10,
    "auto_accept": true
  }
}
```

### POST /api/user/payin-settings

更新用户的代收设置。

**请求参数：**
```json
{
  "enabled": true,
  "maxAmount": 500,
  "dailyLimit": 10,
  "autoAccept": true
}
```

### POST /api/tasks/payin/confirm

确认代收完成。

**请求参数：**
```json
{
  "orderId": "uuid"
}
```

**响应示例：**
```json
{
  "success": true,
  "message": "代收完成，奖励已发放",
  "data": {
    "order": {...},
    "orderAmount": 500,
    "commission": 7.5,
    "newBalance": 1007.5
  }
}
```

## 余额变动逻辑

### 任务分配时
```
可用余额 = 原余额 - 代收金额
冻结余额 = 原冻结余额 + 代收金额
```

### 完成代收时
```
冻结余额 = 原冻结余额 - 代收金额
可用余额 = 原可用余额 + 代收金额 + 佣金
```

## 用户设置详解

### 开启代收功能
- **开启**：系统会自动分配任务
- **关闭**：不会接收任何代收任务

### 单次最高金额
- **0 或留空**：不限制金额
- **500**：只接收金额 ≤ 500 的任务

### 每日限制单数
- **0 或留空**：不限制单数
- **10**：每日最多接收 10 单

### 自动接受任务
- **开启**：系统分配的任务自动生效
- **关闭**：系统分配任务后需要用户确认

## 数据库表

### user_settings 表

存储用户的代收设置：

| 字段 | 类型 | 说明 |
|-----|------|------|
| id | UUID | 主键 |
| user_id | UUID | 用户 ID |
| setting_type | VARCHAR | 设置类型（payin/payout） |
| enabled | BOOLEAN | 是否开启 |
| max_amount | DECIMAL | 单次最高金额 |
| daily_limit | INTEGER | 每日限制单数 |
| auto_accept | BOOLEAN | 自动接受任务 |

## 系统分配逻辑

### 匹配条件

```sql
SELECT *
FROM orders
WHERE type = 'payin'
  AND status = 'pending'
  AND amount <= user_balance
  AND amount <= (SELECT max_amount FROM user_settings WHERE user_id = ? AND setting_type = 'payin')
  AND expires_at > NOW()
ORDER BY amount ASC
LIMIT 1
```

### 分配任务

```sql
UPDATE orders
SET user_id = ?,
    status = 'claimed',
    payment_method = ?,
    payment_account = ?,
    updated_at = NOW()
WHERE id = ?
```

### 冻结余额

```sql
UPDATE users
SET balance = balance - ?,
    frozen_balance = frozen_balance + ?,
    updated_at = NOW()
WHERE id = ?
```

## 示例场景

### 场景 1：正常代收流程

1. 用户设置：单次最高金额 500 元，每日限制 10 单
2. 用户余额：1000 元
3. 系统分配一个 400 元的代收任务
4. 可用余额：600 元，冻结余额：400 元
5. 用户使用微信账户接收款项
6. 完成代收，佣金：6 元
7. 可用余额：1006 元，冻结余额：0 元

### 场景 2：金额超限

1. 用户设置：单次最高金额 300 元
2. 系统尝试分配 500 元的任务
3. 不满足条件，系统跳过此任务

### 场景 3：余额不足

1. 用户余额：200 元
2. 系统尝试分配 300 元的任务
3. 不满足条件，系统跳过此任务

### 场景 4：达到每日限制

1. 用户设置：每日限制 5 单
2. 今日已接收 5 单
3. 系统不再分配新任务，等待第二天重置

## 注意事项

1. **余额检查**：用户余额必须大于代收金额才能接收任务
2. **账户要求**：必须先设置代收账户
3. **设置优先**：用户设置优先于系统默认值
4. **任务唯一性**：同时只能有一个进行中的代收任务
5. **自动解冻**：任务过期或取消后会自动解冻余额

## 常见问题

### Q: 为什么看不到任务？

A: 可能的原因：
1. 代收功能未开启
2. 没有设置代收账户
3. 余额不足
4. 金额设置过小
4. 暂无符合条件的任务

### Q: 如何接收更高金额的任务？

A: 在"代收设置"中增加"单次最高金额"的值。

### Q: 冻结的余额什么时候解冻？

A: 代收任务完成后会自动解冻并返还到可用余额。

### Q: 佣金奖励何时到账？

A: 确认代收完成后，佣金奖励会立即到账。

### Q: 如何暂停接收任务？

A: 在"代收设置"中关闭"开启代收功能"。

### Q: 每日限制何时重置？

A: 每日限制在每天 00:00 重置。

## 后续优化建议

1. 添加任务分配通知（推送通知）
2. 添加任务优先级设置
3. 添加代收账户轮换机制
4. 添加代收任务统计报表
5. 添加智能推荐功能
6. 添加风险控制系统
7. 添加任务审核流程
