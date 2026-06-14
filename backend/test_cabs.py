"""
Quick test script to verify cab_number field is working
Run this after seeding the database
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.cab import Cab

db: Session = SessionLocal()

print("=" * 60)
print("Testing Cab Numbers")
print("=" * 60)

cabs = db.query(Cab).all()

if not cabs:
    print("\n❌ No cabs found in database. Please run: python seed.py\n")
else:
    print(f"\n✅ Found {len(cabs)} cabs in database:\n")
    for cab in cabs:
        cab_num = cab.cab_number or "❌ NOT ASSIGNED"
        print(f"  • {cab.name:20} | Cab Number: {cab_num:20} | Type: {cab.type}")

    # Test serialization
    from app.routers.cabs import serialize_cab
    
    print("\n" + "=" * 60)
    print("Testing API Serialization")
    print("=" * 60 + "\n")
    
    for cab in cabs[:2]:  # Test first 2
        result = serialize_cab(cab)
        cab_num = result.get('cab_number') or "NOT ASSIGNED"
        print(f"✅ {result['name']}: cab_number = '{cab_num}'")

db.close()

print("\n" + "=" * 60)
print("To test the API endpoint, run:")
print('  curl "http://localhost:8001/api/v1/cabs?from=Kharagpur&to=Kolkata+Airport"')
print("=" * 60 + "\n")
