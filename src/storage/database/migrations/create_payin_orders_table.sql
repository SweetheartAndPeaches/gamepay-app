-- 创建代收订单表
-- 用于存储用户主动创建的代收订单

CREATE TABLE IF NOT EXISTS payin_orders (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  account_id BIGINT NOT NULL,

  -- 本地订单信息
  order_no VARCHAR(64) NOT NULL UNIQUE,
  amount NUMERIC(10, 2) NOT NULL,
  commission NUMERIC(10, 2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'created',

  -- 支付平台订单信息
  pay_order_id VARCHAR(64),
  payment_data TEXT,

  -- 支付方式
  payment_method VARCHAR(50) NOT NULL,
  payment_currency VARCHAR(3) NOT NULL,

  -- 支付凭证
  transfer_proof_url TEXT,

  -- 时间信息
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,

  -- 索引
  CONSTRAINT fk_payin_orders_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_payin_orders_account_id FOREIGN KEY (account_id) REFERENCES payment_accounts(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_payin_orders_user_id ON payin_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_payin_orders_account_id ON payin_orders(account_id);
CREATE INDEX IF NOT EXISTS idx_payin_orders_order_no ON payin_orders(order_no);
CREATE INDEX IF NOT EXISTS idx_payin_orders_pay_order_id ON payin_orders(pay_order_id);
CREATE INDEX IF NOT EXISTS idx_payin_orders_status ON payin_orders(status);
CREATE INDEX IF NOT EXISTS idx_payin_orders_created_at ON payin_orders(created_at DESC);

-- 添加注释
COMMENT ON TABLE payin_orders IS '代收订单表';
COMMENT ON COLUMN payin_orders.id IS '订单ID';
COMMENT ON COLUMN payin_orders.user_id IS '用户ID';
COMMENT ON COLUMN payin_orders.account_id IS '代收账户ID';
COMMENT ON COLUMN payin_orders.order_no IS '本地订单号';
COMMENT ON COLUMN payin_orders.amount IS '订单金额（单位：元）';
COMMENT ON COLUMN payin_orders.commission IS '佣金金额（单位：元）';
COMMENT ON COLUMN payin_orders.status IS '订单状态：created-已创建，paying-支付中，success-支付成功，failed-支付失败，closed-订单关闭';
COMMENT ON COLUMN payin_orders.pay_order_id IS '支付平台订单号';
COMMENT ON COLUMN payin_orders.payment_data IS '支付平台返回的支付数据（JSON字符串）';
COMMENT ON COLUMN payin_orders.payment_method IS '支付方式代码（如：COLOMBIA_QR、MILURU_QR）';
COMMENT ON COLUMN payin_orders.payment_currency IS '货币代码（如：COP、PEN）';
COMMENT ON COLUMN payin_orders.transfer_proof_url IS '支付凭证URL（对象存储的签名URL）';
COMMENT ON COLUMN payin_orders.created_at IS '订单创建时间';
COMMENT ON COLUMN payin_orders.updated_at IS '订单更新时间';
COMMENT ON COLUMN payin_orders.expires_at IS '订单过期时间';
