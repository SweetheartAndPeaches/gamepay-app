import sys
import os
sys.path.insert(0, '/workspace/projects')

from datetime import datetime, timedelta
import random

# 使用项目中的 exec_sql 功能
print("Starting data insertion via database connection...")
print("Note: This script requires database access, please run SQL directly")
print("Please use the SQL file: insert_payout_test_data.sql")

# 生成 INSERT 语句
print("\nGenerating INSERT SQL statements...")

payment_methods = ['wechat', 'alipay', 'bank', 'paypal', 'venmo', 'cash_app', 'zelle', 'stripe', 'wise', 'payoneer', 'swift']
statuses = ['pending', 'claimed', 'completed', 'expired', 'cancelled']

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

# 生成SQL文件
count = 500
with open('insert_payout_tasks_auto.sql', 'w') as f:
    # 清理数据
    f.write("DELETE FROM orders WHERE type = 'payout';\n\n")
    
    f.write("INSERT INTO orders (order_no, type, amount, commission, status, payment_method, payment_account, created_at, expires_at, updated_at)\n")
    f.write("VALUES\n")
    
    values = []
    for i in range(count):
        amount = round(random.uniform(100, 10000), 2)
        commission = round(amount * random.uniform(0.005, 0.02), 2)
        status = random.choices(statuses, weights=[0.5, 0.2, 0.2, 0.08, 0.02])[0]
        order_no = f"TEST{i:012d}"
        payment_method = random.choice(payment_methods)
        payment_account = generate_payment_account(payment_method)
        created_at = datetime.now() - timedelta(days=random.uniform(0, 30))
        expires_at = created_at + timedelta(minutes=30)
        
        value = f"  ('{order_no}', 'payout', {amount}, {commission}, '{status}', '{payment_method}', '{payment_account}', '{created_at}', '{expires_at}', NOW())"
        values.append(value)
        
        if (i + 1) % 100 == 0:
            print(f"Generated {i + 1}/{count} SQL statements...")
    
    f.write(',\n'.join(values) + ';\n')
    f.write("\n-- Verify data\n")
    f.write("SELECT status, COUNT(*) as count, ROUND(AVG(amount), 2) as avg_amount FROM orders WHERE type = 'payout' GROUP BY status;\n")

print(f"\nSQL file generated: insert_payout_tasks_auto.sql")
print(f"Total statements: {count}")
print("Please execute this SQL file to insert the data")
