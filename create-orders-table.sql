-- ============================================
-- 创建订单表 (orders)
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_no VARCHAR(50) UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('payout', 'payin')),
  status VARCHAR(20) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'claimed', 'completed', 'expired', 'cancelled')),
  amount DECIMAL(15, 2) NOT NULL,
  commission DECIMAL(15, 2) DEFAULT 0.00 NOT NULL,
  payment_method VARCHAR(50),
  payment_account VARCHAR(200),
  payment_screenshot_url TEXT,
  task_completed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_type ON orders(type);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_order_no ON orders(order_no);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_expires_at ON orders(expires_at);

-- 添加触发器
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 插入一些测试数据
INSERT INTO orders (order_no, type, status, amount, commission, payment_method, expires_at)
VALUES 
  ('PO20250225001', 'payout', 'pending', 100.00, 5.00, 'wechat', NOW() + INTERVAL '2 hours'),
  ('PO20250225002', 'payout', 'pending', 200.00, 10.00, 'alipay', NOW() + INTERVAL '2 hours'),
  ('PO20250225003', 'payout', 'pending', 150.00, 7.50, 'paypal', NOW() + INTERVAL '2 hours')
ON CONFLICT (order_no) DO NOTHING;
