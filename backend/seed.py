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

from app.models.cab import Cab

# ── Seed Cabs ──────────────────────────────────────────────────────────────────
CABS_SEED = [
    {
        "id": "cab-001",
        "name": "Swift Dzire",
        "type": "Sedan",
        "cab_number": "WB-02-B-1234",
        "image_url": "https://imgd.aeplcdn.com/664x374/n/cw/ec/45691/dzire-exterior-right-front-three-quarter-2.jpeg",
        "driver_name": "Rajesh Kumar",
        "driver_phone": "98765XXXXX",
        "driver_rating": 4.8,
        "driver_trips": 1240,
        "rating": 4.8,
        "total_reviews": 312,
        "eta_minutes": 4,
        "fare": 850.0,
        "capacity": 4,
        "amenities": ["AC", "Music"],
        "is_active": True,
    },
    {
        "id": "cab-002",
        "name": "Toyota Innova",
        "type": "SUV",
        "cab_number": "WB-02-K-9876",
        "image_url": "https://imgd.aeplcdn.com/664x374/n/cw/ec/42355/innova-crysta-exterior-right-front-three-quarter-3.jpeg",
        "driver_name": "Suresh Patel",
        "driver_phone": "91234XXXXX",
        "driver_rating": 4.9,
        "driver_trips": 2100,
        "rating": 4.9,
        "total_reviews": 540,
        "eta_minutes": 7,
        "fare": 1400.0,
        "capacity": 7,
        "amenities": ["AC", "Music", "WiFi"],
        "is_active": True,
    },
    {
        "id": "cab-003",
        "name": "Maruti Ertiga",
        "type": "SUV",
        "cab_number": "WB-02-C-5555",
        "image_url": "https://imgd.aeplcdn.com/664x374/n/cw/ec/40087/ertiga-exterior-right-front-three-quarter-4.jpeg",
        "driver_name": "Amit Singh",
        "driver_phone": "87654XXXXX",
        "driver_rating": 4.6,
        "driver_trips": 890,
        "rating": 4.6,
        "total_reviews": 198,
        "eta_minutes": 10,
        "fare": 1100.0,
        "capacity": 6,
        "amenities": ["AC"],
        "is_active": True,
    },
    {
        "id": "cab-004",
        "name": "Honda City",
        "type": "Sedan",
        "cab_number": None,
        "image_url": "https://imgd.aeplcdn.com/664x374/n/cw/ec/134287/city-exterior-right-front-three-quarter-2.jpeg",
        "driver_name": "Vikram Rao",
        "driver_phone": "76543XXXXX",
        "driver_rating": 4.7,
        "driver_trips": 670,
        "rating": 4.7,
        "total_reviews": 145,
        "eta_minutes": 6,
        "fare": 950.0,
        "capacity": 4,
        "amenities": ["AC", "Music"],
        "is_active": True,
    },
    {
        "id": "cab-005",
        "name": "Mahindra XUV700",
        "type": "SUV",
        "cab_number": "WB-02-E-1111",
        "image_url": "https://imgd.aeplcdn.com/664x374/n/cw/ec/42355/xuv700-exterior-right-front-three-quarter.jpeg",
        "driver_name": "Deepak Sharma",
        "driver_phone": "65432XXXXX",
        "driver_rating": 4.9,
        "driver_trips": 430,
        "rating": 4.9,
        "total_reviews": 89,
        "eta_minutes": 12,
        "fare": 1650.0,
        "capacity": 7,
        "amenities": ["AC", "Music", "WiFi", "Charger"],
        "is_active": True,
    },
]

for c_dict in CABS_SEED:
    cab = Cab(
        id=c_dict["id"],
        name=c_dict["name"],
        type=c_dict["type"],
        cab_number=c_dict.get("cab_number"),
        image_url=c_dict["image_url"],
        driver_name=c_dict["driver_name"],
        driver_phone=c_dict["driver_phone"],
        driver_rating=c_dict["driver_rating"],
        driver_trips=c_dict["driver_trips"],
        rating=c_dict["rating"],
        total_reviews=c_dict["total_reviews"],
        eta_minutes=c_dict["eta_minutes"],
        fare=c_dict["fare"],
        capacity=c_dict["capacity"],
        is_active=c_dict["is_active"],
    )
    cab.amenities = c_dict["amenities"]
    db.add(cab)

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
