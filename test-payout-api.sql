-- ============================================
-- 测试代付任务 API 逻辑
-- 模拟 API 查询逻辑
-- ============================================

-- 1. 检查是否有用户的未完成任务
-- 这会导致 API 返回 canClaim: false，不显示任务列表
SELECT
  id,
  order_no,
  type,
  status,
  user_id
FROM orders
WHERE user_id = '你的用户ID'  -- 替换为实际用户ID
  AND type = 'payout'
  AND status = 'claimed';

-- 2. 如果上面的查询有结果，那就是问题所在
-- 用户的 activeTask 阻止了显示新任务

-- 3. 如果没有 activeTask，检查任务列表查询
SELECT
  id,
  order_no,
  type,
  status,
  amount,
  expires_at,
  NOW() as current_time,
  CASE
    WHEN expires_at < NOW() THEN '已过期'
    ELSE '未过期'
  END as is_expired
FROM orders
WHERE type = 'payout'
  AND status = 'pending'
  AND expires_at > NOW()
ORDER BY created_at DESC
LIMIT 20;

-- ============================================
-- 临时修复：删除用户的所有进行中任务
-- ============================================
-- 如果你之前有未完成的代付任务卡住了，可以删除它们
-- UPDATE orders
-- SET status = 'cancelled'
-- WHERE user_id = '你的用户ID'
--   AND type = 'payout'
--   AND status = 'claimed';

-- ============================================
-- 测试 API 响应格式
-- ============================================
-- API 应该返回这样的格式：
-- {
--   "success": true,
--   "message": "获取任务列表成功",
--   "data": {
--     "canClaim": true,
--     "tasks": [...]
--   }
-- }
