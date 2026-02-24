-- ============================================
-- 代收账户设置扩展（payment_accounts 表）
-- 为 payment_accounts 表添加代收相关字段
-- ============================================

-- 添加代收相关字段
ALTER TABLE payment_accounts
  ADD COLUMN IF NOT EXISTS payin_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS payin_max_amount DECIMAL(15, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS payin_allocated_amount DECIMAL(15, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS payin_earned_commission DECIMAL(15, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS payin_total_count INTEGER DEFAULT 0;

-- 添加注释
COMMENT ON COLUMN payment_accounts.payin_enabled IS '是否启用该账户进行代收';
COMMENT ON COLUMN payment_accounts.payin_max_amount IS '该账户代收金额上限（0表示无限制）';
COMMENT ON COLUMN payment_accounts.payin_allocated_amount IS '该账户已分配的代收金额';
COMMENT ON COLUMN payment_accounts.payin_earned_commission IS '该账户已获得的佣金总额';
COMMENT ON COLUMN payment_accounts.payin_total_count IS '该账户完成的代收任务总数';

-- ============================================
-- 说明
-- ============================================
-- payin_enabled:
--   - true: 启用该账户进行代收
--   - false: 禁用该账户进行代收
--
-- payin_max_amount:
--   - 0: 无限制，可以使用用户全部余额
--   - >0: 该账户最多只能接收此金额的代收任务
--
-- payin_allocated_amount:
--   - 已分配给该账户的代收金额
--   - 领取任务时增加，完成/取消时减少
--
-- payin_earned_commission:
--   - 该账户已获得的佣金总额
--   - 完成代收任务时增加
--
-- payin_total_count:
--   - 该账户完成的代收任务总数
--   - 完成代收任务时增加
--
-- ============================================
-- 使用示例
-- ============================================
-- 1. 为账户启用代收，设置金额上限为 1000 元：
-- UPDATE payment_accounts
-- SET payin_enabled = true, payin_max_amount = 1000
-- WHERE id = 'xxx';
--
-- 2. 为账户启用代收，无金额限制：
-- UPDATE payment_accounts
-- SET payin_enabled = true, payin_max_amount = 0
-- WHERE id = 'xxx';
--
-- 3. 查询用户的代收账户：
-- SELECT * FROM payment_accounts
-- WHERE user_id = 'xxx' AND payin_enabled = true AND is_active = true;
--
-- 4. 查询账户剩余可分配金额：
-- SELECT
--   id,
--   payin_max_amount,
--   payin_allocated_amount,
--   CASE
--     WHEN payin_max_amount = 0 THEN '无限制'
--     ELSE (payin_max_amount - payin_allocated_amount)::text
--   END as remaining_amount
-- FROM payment_accounts
-- WHERE id = 'xxx';
