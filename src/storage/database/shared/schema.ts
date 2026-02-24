import { pgTable, serial, timestamp } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import {
  text,
  varchar,
  boolean,
  integer,
  jsonb,
  numeric,
  index,
} from "drizzle-orm/pg-core"

// 系统表 - 保留
export const healthCheck = pgTable("health_check", {
  id: serial().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
})

// 用户表
export const users = pgTable(
  "users",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    phone: varchar("phone", { length: 20 }).notNull().unique(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    balance: numeric("balance", { precision: 15, scale: 2 }).notNull().default("0.00"),
    frozenBalance: numeric("frozen_balance", { precision: 15, scale: 2 }).notNull().default("0.00"),
    inviteCode: varchar("invite_code", { length: 20 }).notNull().unique(),
    inviterId: varchar("inviter_id", { length: 36 }),
    googleAuthSecret: varchar("google_auth_secret", { length: 255 }),
    googleAuthEnabled: boolean("google_auth_enabled").default(false),
    status: varchar("status", { length: 20 }).notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("users_phone_idx").on(table.phone),
    index("users_invite_code_idx").on(table.inviteCode),
    index("users_inviter_id_idx").on(table.inviterId),
  ]
)

// 收付款账户表
export const paymentAccounts = pgTable(
  "payment_accounts",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id", { length: 36 }).notNull(),
    accountType: varchar("account_type", { length: 50 }).notNull(), // wechat_qrcode, alipay_qrcode, alipay_account, bank_card
    accountInfo: jsonb("account_info").notNull(), // 存储账户详细信息
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("payment_accounts_user_id_idx").on(table.userId),
    index("payment_accounts_type_idx").on(table.accountType),
  ]
)

// 商户表
export const merchants = pgTable(
  "merchants",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: varchar("name", { length: 255 }).notNull(),
    apiKey: varchar("api_key", { length: 255 }).notNull().unique(),
    secretKey: varchar("secret_key", { length: 255 }).notNull(),
    balance: numeric("balance", { precision: 15, scale: 2 }).notNull().default("0.00"),
    status: varchar("status", { length: 20 }).notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("merchants_api_key_idx").on(table.apiKey),
    index("merchants_status_idx").on(table.status),
  ]
)

// 任务配置表
export const taskConfigs = pgTable(
  "task_configs",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    amountRange: varchar("amount_range", { length: 50 }).notNull(), // 100-500, 501-1000
    minDailyTasks: integer("min_daily_tasks").notNull().default(0),
    rewardRate: numeric("reward_rate", { precision: 5, scale: 4 }).notNull().default("0.0050"), // 奖励比例
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("task_configs_range_idx").on(table.amountRange),
  ]
)

// 任务表（代付/代收）
export const tasks = pgTable(
  "tasks",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    merchantId: varchar("merchant_id", { length: 36 }).notNull(),
    taskType: varchar("task_type", { length: 20 }).notNull(), // payout, payin
    orderNo: varchar("order_no", { length: 100 }).notNull().unique(), // 商户订单号
    amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
    rewardRatio: numeric("reward_ratio", { precision: 5, scale: 4 }).notNull(), // 手续费比例
    status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, claimed, completed, cancelled, timeout
    claimedBy: varchar("claimed_by", { length: 36 }),
    claimedAt: timestamp("claimed_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    paymentInfo: jsonb("payment_info"), // 收款方信息或支付方信息
    expiredAt: timestamp("expired_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("tasks_merchant_id_idx").on(table.merchantId),
    index("tasks_order_no_idx").on(table.orderNo),
    index("tasks_status_idx").on(table.status),
    index("tasks_task_type_idx").on(table.taskType),
    index("tasks_claimed_by_idx").on(table.claimedBy),
  ]
)

// 代收子任务表（用于拆分大额订单）
export const subTasks = pgTable(
  "sub_tasks",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    taskId: varchar("task_id", { length: 36 }).notNull(),
    subOrderNo: varchar("sub_order_no", { length: 100 }).notNull().unique(),
    amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
    paymentMethod: varchar("payment_method", { length: 50 }).notNull(),
    status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, claimed, confirmed, cancelled
    claimedBy: varchar("claimed_by", { length: 36 }),
    claimedAt: timestamp("claimed_at", { withTimezone: true }),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("sub_tasks_task_id_idx").on(table.taskId),
    index("sub_tasks_status_idx").on(table.status),
    index("sub_tasks_claimed_by_idx").on(table.claimedBy),
  ]
)

// 代理关系表
export const agentRelationships = pgTable(
  "agent_relationships",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    agentId: varchar("agent_id", { length: 36 }).notNull(), // 代理用户ID
    referrerId: varchar("referrer_id", { length: 36 }), // 上级代理ID
    commissionRate: numeric("commission_rate", { precision: 5, scale: 4 }).notNull().default("0.0100"), // 佣金比例
    level: integer("level").notNull().default(1), // 代理等级
    totalReferrals: integer("total_referrals").notNull().default(0), // 总推荐人数
    status: varchar("status", { length: 20 }).notNull().default("active"), // active, suspended
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("agent_relationships_agent_id_idx").on(table.agentId),
    index("agent_relationships_referrer_id_idx").on(table.referrerId),
    index("agent_relationships_status_idx").on(table.status),
  ]
)

// 佣金记录表
export const commissions = pgTable(
  "commissions",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    agentId: varchar("agent_id", { length: 36 }).notNull(),
    referrerId: varchar("referrer_id", { length: 36 }), // 佣金来源用户ID
    subUserId: varchar("sub_user_id", { length: 36 }), // 下级用户ID
    taskId: varchar("task_id", { length: 36 }),
    subTaskId: varchar("sub_task_id", { length: 36 }),
    commissionAmount: numeric("commission_amount", { precision: 15, scale: 2 }).notNull(),
    commissionType: varchar("commission_type", { length: 20 }).notNull(), // payout, payin
    status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, settled
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("commissions_agent_id_idx").on(table.agentId),
    index("commissions_task_id_idx").on(table.taskId),
    index("commissions_status_idx").on(table.status),
  ]
)

// 交易记录表
export const transactions = pgTable(
  "transactions",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id", { length: 36 }).notNull(),
    transactionType: varchar("transaction_type", { length: 50 }).notNull(), // task_reward, commission, withdrawal, deposit, freeze, unfreeze
    amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
    balanceAfter: numeric("balance_after", { precision: 15, scale: 2 }).notNull(),
    frozenAmount: numeric("frozen_amount", { precision: 15, scale: 2 }).default("0.00"),
    relatedId: varchar("related_id", { length: 36 }), // 关联的任务ID、提现记录ID等
    relatedType: varchar("related_type", { length: 50 }), // 关联类型
    remark: text("remark"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("transactions_user_id_idx").on(table.userId),
    index("transactions_type_idx").on(table.transactionType),
    index("transactions_created_at_idx").on(table.createdAt),
  ]
)

// 提现记录表
export const withdrawalRecords = pgTable(
  "withdrawal_records",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id", { length: 36 }).notNull(),
    amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
    fee: numeric("fee", { precision: 15, scale: 2 }).default("0.00"),
    actualAmount: numeric("actual_amount", { precision: 15, scale: 2 }).notNull(),
    bankAccountInfo: jsonb("bank_account_info").notNull(),
    status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, processing, completed, rejected
    processedAt: timestamp("processed_at", { withTimezone: true }),
    remark: text("remark"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("withdrawal_records_user_id_idx").on(table.userId),
    index("withdrawal_records_status_idx").on(table.status),
  ]
)

// 用户每日任务统计表
export const dailyTaskStats = pgTable(
  "daily_task_stats",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id", { length: 36 }).notNull(),
    date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
    amountRange: varchar("amount_range", { length: 50 }).notNull(),
    completedCount: integer("completed_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("daily_task_stats_user_date_idx").on(table.userId, table.date),
    index("daily_task_stats_range_idx").on(table.amountRange),
  ]
)
