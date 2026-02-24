-- ============================================
-- 代收任务分配表 (payin_task_allocations)
-- 用于存储从其他系统分配给用户的代收任务
-- ============================================
CREATE TABLE IF NOT EXISTS payin_task_allocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  order_no VARCHAR(50) UNIQUE NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  commission DECIMAL(15, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'claimed', 'completed', 'cancelled', 'timeout')),
  payment_method VARCHAR(50) NOT NULL,
  payment_account_info JSONB NOT NULL,
  transfer_proof_url TEXT,
  claimed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_payin_task_allocations_user_id ON payin_task_allocations(user_id);
CREATE INDEX IF NOT EXISTS idx_payin_task_allocations_status ON payin_task_allocations(status);
CREATE INDEX IF NOT EXISTS idx_payin_task_allocations_expires_at ON payin_task_allocations(expires_at);
CREATE INDEX IF NOT EXISTS idx_payin_task_allocations_order_no ON payin_task_allocations(order_no);

-- 添加触发器
CREATE TRIGGER update_payin_task_allocations_updated_at
  BEFORE UPDATE ON payin_task_allocations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 插入示例数据（可以从其他系统同步）
-- ============================================
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
    NULL, -- user_id 会在分配时设置
    'PAYIN001',
    500.00,
    7.50,
    'wechat',
    '{"name": "张三", "account": "wx123456", "type": "微信"}',
    timezone('utc'::text, now()) + interval '30 minutes'
  ),
  (
    NULL,
    'PAYIN002',
    800.00,
    12.00,
    'alipay',
    '{"name": "李四", "account": "ali123456", "type": "支付宝"}',
    timezone('utc'::text, now()) + interval '30 minutes'
  )
ON CONFLICT (order_no) DO NOTHING;

-- ============================================
-- 说明
-- ============================================
-- payment_account_info 字段结构示例：
-- {
--   "name": "收款人姓名",
--   "account": "收款账号",
--   "type": "账户类型",
--   "bank": "开户银行" (可选),
--   "branch": "开户行" (可选)
-- }
--
-- status 状态说明：
-- - pending: 待领取
-- - claimed: 已领取（已冻结余额）
-- - completed: 已完成（已收到款项，已发放奖励）
-- - cancelled: 已取消
-- - timeout: 已超时
