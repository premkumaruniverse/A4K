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

from sqlalchemy import text
from app.config import settings

# ── Drop & recreate ────────────────────────────────────────────────────────────
if "postgres" in settings.DATABASE_URL:
    with engine.begin() as conn:
        conn.execute(text("CREATE SCHEMA IF NOT EXISTS airport4kgp"))

Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

db: Session = SessionLocal()

# ── Fixed routes ───────────────────────────────────────────────────────────────
ROUTES = [
    {"from": "Kharagpur",       "to": "Kolkata Airport"},
    {"from": "Kolkata Airport", "to": "Kharagpur"},
]

# ── Images (High Quality Vehicle Images) ──────────────────────────────────────
IMAGES = [
    "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=80", # White Bus
    "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=800&q=80", # Blue Bus
    "https://images.unsplash.com/photo-1464219222984-216eb6fca743?w=800&q=80", # Yellow Van
    "https://images.unsplash.com/photo-1590333746438-283503806bb2?w=800&q=80", # Luxury Coach
    "https://images.unsplash.com/photo-1562620644-65ca4da00174?w=800&q=80"  # Shuttle
]

OPERATORS = [
    {"name": "KGP Shuttle Service", "price": 450, "rating": 4.8},
    {"name": "Bengal Travels",      "price": 500, "rating": 4.6},
    {"name": "Airport Connect",     "price": 420, "rating": 4.5},
    {"name": "Luxury Line",         "price": 650, "rating": 4.9}
]

# ── Schedule: multiple daily departures for the next 30 days ───────────────────
KGP_CCU_TIMES = ["05:30", "08:00", "11:00", "14:30", "18:00", "21:00"]
CCU_KGP_TIMES = ["06:00", "09:00", "12:00", "16:00", "19:00", "22:00"]
JOURNEY_HOURS = 3 

today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

ride_count = 0

for day_offset in range(30):
    day = today + timedelta(days=day_offset)

    for i, time_str in enumerate(KGP_CCU_TIMES):
        h, m = map(int, time_str.split(":"))
        dep = day.replace(hour=h, minute=m)
        arr = dep + timedelta(hours=JOURNEY_HOURS)
        
        op = OPERATORS[i % len(OPERATORS)]

        ride = Ride(
            type="traveller",
            operator_name=op["name"],
            from_city="Kharagpur",
            to_city="Kolkata Airport",
            departure_time=dep,
            arrival_time=arr,
            price=op["price"] - 20,
            rating=op["rating"],
            total_reviews=100 + (day_offset * 5) + (i * 10),
            total_seats=17,
            available_seats=17,
            image_url=IMAGES[i % len(IMAGES)],
            is_active=True,
        )
        ride.amenities = ["AC", "WiFi", "Charging Port", "Bottle"]
        db.add(ride)
        db.flush()

        for n in range(1, 18):
            seat_price = ride.price + ((n % 3) * 50)
            db.add(Seat(ride_id=ride.id, seat_number=str(n), seat_type="seater", status="available", price=seat_price))
        ride_count += 1

    for i, time_str in enumerate(CCU_KGP_TIMES):
        h, m = map(int, time_str.split(":"))
        dep = day.replace(hour=h, minute=m)
        arr = dep + timedelta(hours=JOURNEY_HOURS)
        
        op = OPERATORS[(i+1) % len(OPERATORS)]

        ride = Ride(
            type="traveller",
            operator_name=op["name"],
            from_city="Kolkata Airport",
            to_city="Kharagpur",
            departure_time=dep,
            arrival_time=arr,
            price=op["price"] - 20,
            rating=op["rating"],
            total_reviews=90 + (day_offset * 4) + (i * 8),
            total_seats=17,
            available_seats=17,
            image_url=IMAGES[(i + 1) % len(IMAGES)],
            is_active=True,
        )
        ride.amenities = ["AC", "WiFi", "Music", "USB"]
        db.add(ride)
        db.flush()

        for n in range(1, 18):
            seat_price = ride.price + ((n % 3) * 50)
            db.add(Seat(ride_id=ride.id, seat_number=str(n), seat_type="seater", status="available", price=seat_price))
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
print(f"   Routes        : Kharagpur <-> Kolkata Airport")
print(f"   Days seeded   : 30")
