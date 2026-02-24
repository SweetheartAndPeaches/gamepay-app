-- ============================================
-- 检查代付任务数据
-- 在 Supabase SQL Editor 中执行此脚本
-- ============================================

-- 查看所有订单
SELECT
  id,
  order_no,
  type,
  status,
  amount,
  commission,
  expires_at,
  created_at,
  user_id,
  NOW() as current_time,
  CASE
    WHEN expires_at < NOW() THEN '已过期'
    ELSE '未过期'
  END as is_expired
FROM orders
ORDER BY created_at DESC
LIMIT 10;

-- 查看符合条件的代付任务（应该显示的）
SELECT
  id,
  order_no,
  type,
  status,
  amount,
  commission,
  expires_at,
  CASE
    WHEN expires_at < NOW() THEN '已过期'
    ELSE '未过期'
  END as is_expired
FROM orders
WHERE type = 'payout'
  AND status = 'pending'
  AND expires_at > NOW()
ORDER BY created_at DESC
LIMIT 10;

-- 如果没有符合条件的任务，查看所有代付任务并分析原因
SELECT
  id,
  order_no,
  type,
  status,
  CASE
    WHEN status != 'pending' THEN '状态不是pending'
    WHEN type != 'payout' THEN '类型不是payout'
    WHEN expires_at < NOW() THEN '已过期'
    ELSE '应该显示'
  END as why_not_showing,
  expires_at,
  NOW() as current_time
FROM orders
WHERE type = 'payout'
ORDER BY created_at DESC
LIMIT 10;

-- ============================================
-- 常见问题修复
-- ============================================

-- 1. 如果订单类型不是 'payout'，更新为 'payout'
-- UPDATE orders SET type = 'payout' WHERE type != 'payout';

-- 2. 如果订单状态不是 'pending'，更新为 'pending'
-- UPDATE orders SET status = 'pending' WHERE status != 'pending';

-- 3. 如果订单已过期，更新过期时间为未来时间（例如：30分钟后）
-- UPDATE orders
-- SET expires_at = NOW() + interval '30 minutes'
-- WHERE expires_at < NOW();

-- 4. 如果订单没有关联用户，需要添加 user_id
-- UPDATE orders
-- SET user_id = '你的用户ID'
-- WHERE user_id IS NULL OR user_id = '';

-- ============================================
-- 插入测试代付任务（如果需要）
-- ============================================
-- INSERT INTO orders (
--   user_id,
--   order_no,
--   type,
--   amount,
--   commission,
--   status,
--   payment_method,
--   payment_account,
--   expires_at
-- ) VALUES (
--   NULL, -- user_id 为 NULL，任何用户都可以领取
--   'PAYOUT' || LPAD(nextval('order_no_seq')::text, 3, '0'),
--   'payout',
--   100.00,
--   1.00,
--   'pending',
--   'wechat',
--   'test_account',
--   NOW() + interval '30 minutes'
-- );
