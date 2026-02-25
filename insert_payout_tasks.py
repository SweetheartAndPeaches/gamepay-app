import sys
import os
sys.path.insert(0, '/workspace/projects')

import psycopg2
from datetime import datetime, timedelta
import random

# 数据库连接配置
DB_URL = os.environ.get('DATABASE_URL') or "postgresql://postgres:postgres@localhost:5432/postgres"

print(f"Connecting to database...")
conn = psycopg2.connect(DB_URL)
cursor = conn.cursor()

print("Connected. Starting data insertion...")

# 支付方式列表
payment_methods = ['wechat', 'alipay', 'bank', 'paypal', 'venmo', 'cash_app', 'zelle', 'stripe', 'wise', 'payoneer', 'swift']

# 状态列表
statuses = ['pending', 'claimed', 'completed', 'expired', 'cancelled']

# 生成账户信息
def generate_payment_account(method):
    if method == 'wechat':
        return f"wx_{random.randint(100000, 999999)}"
    elif method == 'alipay':
        return f"ali_{random.randint(100000, 999999)}"
    elif method == 'bank':
        return f"6222{str(random.randint(10**15, 10**16-1))}"
    elif method == 'paypal':
        return f"paypal{random.randint(1, 10000)}@email.com"
    elif method == 'venmo':
        return f"@venmo_user_{random.randint(1, 10000)}"
    elif method == 'cash_app':
        return f"$cashapp_{random.randint(1, 10000)}"
    elif method == 'zelle':
        return f"zelle{random.randint(1, 10000)}@email.com"
    elif method == 'stripe':
        return f"acct_{random.randint(10**15, 10**16)}"
    elif method == 'wise':
        return f"wise_{random.randint(100000, 999999)}"
    elif method == 'payoneer':
        return f"payoneer{random.randint(1, 10000)}@email.com"
    elif method == 'swift':
        return f"SWIFT{random.randint(100000, 999999)}"
    return ""

# 插入500条数据
count = 500
for i in range(count):
    try:
        amount = round(random.uniform(100, 10000), 2)
        commission = round(amount * random.uniform(0.005, 0.02), 2)
        status = random.choices(statuses, weights=[0.5, 0.2, 0.2, 0.08, 0.02])[0]

        # 生成订单号
        order_no = f"PO{i:012d}"

        # 选择支付方式
        payment_method = random.choice(payment_methods)
        payment_account = generate_payment_account(payment_method)

        # 生成时间
        created_at = datetime.now() - timedelta(days=random.uniform(0, 30))
        expires_at = created_at + timedelta(minutes=30)

        # 插入数据
        insert_sql = """
            INSERT INTO orders (order_no, type, amount, commission, status, payment_method, payment_account, created_at, expires_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """

        cursor.execute(insert_sql, (
            order_no,
            'payout',
            amount,
            commission,
            status,
            payment_method,
            payment_account,
            created_at,
            expires_at,
            datetime.now()
        ))

        if (i + 1) % 50 == 0:
            print(f"Inserted {i + 1}/{count} records...")
            conn.commit()

    except Exception as e:
        print(f"Error inserting record {i}: {e}")
        conn.rollback()
        continue

conn.commit()

# 验证插入的数据
cursor.execute("SELECT COUNT(*) FROM orders WHERE type = 'payout'")
total = cursor.fetchone()[0]
print(f"\nTotal payout tasks inserted: {total}")

# 按状态统计
cursor.execute("""
    SELECT status, COUNT(*) as count
    FROM orders
    WHERE type = 'payout'
    GROUP BY status
    ORDER BY status
""")
print("\nStatus distribution:")
for row in cursor.fetchall():
    print(f"  {row[0]}: {row[1]}")

cursor.close()
conn.close()
print("\nData insertion completed!")
