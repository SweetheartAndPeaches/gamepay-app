-- 删除旧的测试数据
DELETE FROM orders WHERE type = 'payout';

-- 插入500条测试数据
INSERT INTO orders (order_no, type, amount, commission, status, payment_method, payment_account, created_at, expires_at, updated_at)
SELECT
  'TEST' || LPAD(s::text, 12, '0'),
  'payout',
  ROUND(100 + random() * 9900, 2)::numeric,
  ROUND((100 + random() * 9900) * 0.01, 2)::numeric,
  (ARRAY['pending','claimed','completed','expired','cancelled'])[1 + FLOOR(random() * 5)],
  (ARRAY['wechat','alipay','bank','paypal','venmo','cash_app','zelle','stripe','wise','payoneer','swift'])[1 + FLOOR(random() * 11)],
  CASE (ARRAY['wechat','alipay','bank','paypal','venmo','cash_app','zelle','stripe','wise','payoneer','swift'])[1 + FLOOR(random() * 11)]
    WHEN 'wechat' THEN 'wx_' || substr(md5(random()::text), 1, 6)
    WHEN 'alipay' THEN 'ali_' || substr(md5(random()::text), 1, 6)
    WHEN 'bank' THEN '6222' || LPAD(FLOOR(random() * 1000000000000000)::text, 15, '0')
    WHEN 'paypal' THEN 'paypal' || FLOOR(random() * 10000) || '@email.com'
    WHEN 'venmo' THEN '@venmo_user_' || FLOOR(random() * 10000)
    WHEN 'cash_app' THEN '$cashapp_' || FLOOR(random() * 10000)
    WHEN 'zelle' THEN 'zelle' || FLOOR(random() * 10000) || '@email.com'
    WHEN 'stripe' THEN 'acct_' || substr(md5(random()::text), 1, 16)
    WHEN 'wise' THEN 'wise_' || substr(md5(random()::text), 1, 8)
    WHEN 'payoneer' THEN 'payoneer' || FLOOR(random() * 10000) || '@email.com'
    WHEN 'swift' THEN 'SWIFT' || upper(substr(md5(random()::text), 1, 6))
  END,
  NOW() - (random() * interval '30 days'),
  NOW() - (random() * interval '30 days') + interval '30 minutes',
  NOW()
FROM generate_series(1, 500) s;

-- 验证插入的数据
SELECT
  status,
  COUNT(*) as count,
  ROUND(AVG(amount), 2) as avg_amount,
  ROUND(SUM(amount), 2) as total_amount,
  ROUND(SUM(commission), 2) as total_commission
FROM orders
WHERE type = 'payout'
GROUP BY status
ORDER BY status;
