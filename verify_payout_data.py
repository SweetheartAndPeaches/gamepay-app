import requests
import json
from collections import Counter

url = "https://eplavqbtysmknzdcbgbq.supabase.co/rest/v1/orders"
headers = {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwbGF2cWJ0eXNta256ZGNiZ2JxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODQwMjg4MywiZXhwIjoyMDgzOTc4ODgzfQ.keuWImauN-GtdCp4vu4lxwdpjZheLlLqlsx1MaQZoMU",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwbGF2cWJ0eXNta256ZGNiZ2JxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODQwMjg4MywiZXhwIjoyMDgzOTc4ODgzfQ.keuWImauN-GtdCp4vu4lxwdpjZheLlLqlsx1MaQZoMU",
    "Accept-Profile": "public"
}

params = {
    "select": "status,payment_method,amount,commission,created_at,expires_at",
    "order_no": "like.ORD17719911232%",
    "type": "eq.payout"
}

response = requests.get(url, headers=headers, params=params)
data = response.json()

print(f"Total tasks inserted in this batch: {len(data)}")
print()

# Status distribution
status_counts = Counter([d['status'] for d in data])
print("Status distribution:")
for status, count in sorted(status_counts.items()):
    print(f"  {status}: {count} ({count/len(data)*100:.1f}%)")

print()

# Payment method distribution
payment_counts = Counter([d['payment_method'] for d in data])
print("Payment method distribution:")
for method, count in sorted(payment_counts.items()):
    print(f"  {method}: {count} ({count/len(data)*100:.1f}%)")

print()

# Amount range
amounts = [d['amount'] for d in data]
print(f"Amount range: ${min(amounts):.2f} - ${max(amounts):.2f}")
print(f"Average amount: ${sum(amounts)/len(amounts):.2f}")

print()

# Commission range
commissions = [d['commission'] for d in data]
print(f"Commission range: ${min(commissions):.2f} - ${max(commissions):.2f}")
print(f"Average commission: ${sum(commissions)/len(commissions):.2f}")

print()

# Sample records
print("Sample records:")
for i, record in enumerate(data[:5]):
    print(f"  {i+1}. {record['order_no'] if 'order_no' in record else 'N/A'} - {record['status']} - ${record['amount']:.2f} - {record['payment_method']}")
