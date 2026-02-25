import psycopg2
import os

# 数据库连接配置
DB_URL = os.environ.get('DATABASE_URL') or "postgresql://postgres:7474+CxZ.52@db.eplavqbtysmknzdcbgbq.supabase.co:5432/postgres"

print(f"Connecting to database...")
conn = psycopg2.connect(DB_URL)
cursor = conn.cursor()

print("Connected. Reading SQL file...")

# 读取 SQL 文件
with open('/workspace/projects/insert_payout_tasks_auto.sql', 'r') as f:
    sql_content = f.read()

print("Executing SQL...")

# 执行 SQL（executescript 可以执行多条语句）
cursor.execute(sql_content)

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
