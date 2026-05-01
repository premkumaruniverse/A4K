"""
Re-seed the database with fixed-route traveller rides.
Kharagpur → Kolkata Airport and Kolkata Airport → Kharagpur.
Each ride has 17 seats numbered 1-17.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.database import engine, Base, SessionLocal
from app.models.ride import Ride
from app.models.seat import Seat
from app.models.user import User
import app.models  # register all models

# ── Drop & recreate ────────────────────────────────────────────────────────────
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

db: Session = SessionLocal()

# ── Fixed routes ───────────────────────────────────────────────────────────────
ROUTES = [
    {"from": "Kharagpur",       "to": "Kolkata Airport"},
    {"from": "Kolkata Airport", "to": "Kharagpur"},
]

# ── Schedule: multiple daily departures for the next 7 days ───────────────────
KGP_CCU_TIMES = ["05:30", "08:00", "11:00", "14:30", "18:00", "21:00"]
CCU_KGP_TIMES = ["06:00", "09:00", "12:00", "16:00", "19:00", "22:00"]
JOURNEY_HOURS = 3  # ~3 hours journey

PRICE_KGP_CCU = 450.0
PRICE_CCU_KGP = 450.0
TOTAL_SEATS   = 17
OPERATOR      = "KGP Shuttle Service"

today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

ride_count = 0

for day_offset in range(7):   # seed 7 days
    day = today + timedelta(days=day_offset)

    for time_str in KGP_CCU_TIMES:
        h, m = map(int, time_str.split(":"))
        dep = day.replace(hour=h, minute=m)
        arr = dep + timedelta(hours=JOURNEY_HOURS)

        ride = Ride(
            type="traveller",
            operator_name=OPERATOR,
            from_city="Kharagpur",
            to_city="Kolkata Airport",
            departure_time=dep,
            arrival_time=arr,
            price=PRICE_KGP_CCU,
            rating=4.5,
            total_reviews=120,
            total_seats=TOTAL_SEATS,
            available_seats=TOTAL_SEATS,
            is_active=True,
        )
        ride.amenities = ["AC", "WiFi", "Charging Port"]
        db.add(ride)
        db.flush()

        for n in range(1, TOTAL_SEATS + 1):
            db.add(Seat(ride_id=ride.id, seat_number=str(n), seat_type="seater", status="available"))

        ride_count += 1

    for time_str in CCU_KGP_TIMES:
        h, m = map(int, time_str.split(":"))
        dep = day.replace(hour=h, minute=m)
        arr = dep + timedelta(hours=JOURNEY_HOURS)

        ride = Ride(
            type="traveller",
            operator_name=OPERATOR,
            from_city="Kolkata Airport",
            to_city="Kharagpur",
            departure_time=dep,
            arrival_time=arr,
            price=PRICE_CCU_KGP,
            rating=4.5,
            total_reviews=98,
            total_seats=TOTAL_SEATS,
            available_seats=TOTAL_SEATS,
            is_active=True,
        )
        ride.amenities = ["AC", "WiFi", "Charging Port"]
        db.add(ride)
        db.flush()

        for n in range(1, TOTAL_SEATS + 1):
            db.add(Seat(ride_id=ride.id, seat_number=str(n), seat_type="seater", status="available"))

        ride_count += 1

# ── Create admin user ──────────────────────────────────────────────────────────
admin_user = User(
    phone="9999999999",
    name="Admin",
    email="admin@kgpshuttle.com",
    is_active=True,
    is_admin=True,
)
db.add(admin_user)

db.commit()
db.close()

print(f"\n[OK] Database seeded successfully!")
print(f"   Rides created : {ride_count}")
print(f"   Seats per ride: {TOTAL_SEATS}")
print(f"   Admin phone   : 9999999999")
print(f"   Routes        : Kharagpur <-> Kolkata Airport")
print(f"   Days seeded   : 7 (today + 6 days)")
