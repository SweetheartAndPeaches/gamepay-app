-- ============================================
-- 为 payin_task_allocations 表添加 account_id 字段
-- ============================================

-- 添加 account_id 字段
ALTER TABLE payin_task_allocations
  ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES payment_accounts(id) ON DELETE SET NULL;

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_payin_task_allocations_account_id ON payin_task_allocations(account_id);

-- 添加注释
COMMENT ON COLUMN payin_task_allocations.account_id IS '代收账户ID（关联 payment_accounts 表）';

-- ============================================
-- 说明
-- ============================================
-- account_id 字段用于记录领取任务时使用的代收账户
-- 这样可以在任务完成时更新该账户的统计信息
-- ============================================
