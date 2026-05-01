from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import uuid

from app.database import get_db
from app.models.ride import Ride
from app.models.seat import Seat
from app.models.booking import Booking
from app.models.user import User
from app.schemas.ride import (
    RideDetailSchema, SeatSchema, RideSchema,
    CreateTravellerRequest, UpdateTravellerRequest,
)
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/admin", tags=["Admin"])

VALID_ROUTES = [
    ("Kharagpur", "Kolkata Airport"),
    ("Kolkata Airport", "Kharagpur"),
]


def _require_admin(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


# ── Travellers ─────────────────────────────────────────────────────────────────
@router.get("/travellers", response_model=List[RideDetailSchema])
def list_travellers(
    db: Session = Depends(get_db),
    _admin: User = Depends(_require_admin),
):
    rides = db.query(Ride).filter(Ride.type == "traveller").order_by(Ride.departure_time).all()
    results = []
    for r in rides:
        seats = db.query(Seat).filter(Seat.ride_id == r.id).order_by(Seat.seat_number).all()
        results.append(RideDetailSchema(
            id=r.id, type=r.type, operator_name=r.operator_name,
            from_city=r.from_city, to_city=r.to_city,
            departure_time=r.departure_time, arrival_time=r.arrival_time,
            price=r.price, rating=r.rating, total_reviews=r.total_reviews,
            amenities=r.amenities, total_seats=r.total_seats,
            available_seats=r.available_seats,
            seats=[SeatSchema.model_validate(s) for s in seats],
        ))
    return results


@router.post("/travellers", response_model=RideDetailSchema, status_code=status.HTTP_201_CREATED)
def create_traveller(
    request: CreateTravellerRequest,
    db: Session = Depends(get_db),
    _admin: User = Depends(_require_admin),
):
    # Validate route
    route_valid = any(
        r[0].lower() == request.from_city.lower() and r[1].lower() == request.to_city.lower()
        for r in VALID_ROUTES
    )
    if not route_valid:
        raise HTTPException(
            status_code=400,
            detail="Invalid route. Only Kharagpur ↔ Kolkata Airport is supported.",
        )

    ride = Ride(
        type="traveller",
        operator_name=request.operator_name,
        from_city=request.from_city,
        to_city=request.to_city,
        departure_time=request.departure_time,
        arrival_time=request.arrival_time,
        price=request.price,
        total_seats=request.total_seats,
        available_seats=request.total_seats,
        is_active=True,
    )
    ride.amenities = []
    db.add(ride)
    db.flush()

    # Create seats numbered 1..total_seats
    seats = []
    for num in range(1, request.total_seats + 1):
        seat = Seat(ride_id=ride.id, seat_number=str(num), seat_type="seater", status="available")
        db.add(seat)
        seats.append(seat)

    db.commit()
    db.refresh(ride)

    return RideDetailSchema(
        id=ride.id, type=ride.type, operator_name=ride.operator_name,
        from_city=ride.from_city, to_city=ride.to_city,
        departure_time=ride.departure_time, arrival_time=ride.arrival_time,
        price=ride.price, rating=ride.rating, total_reviews=ride.total_reviews,
        amenities=ride.amenities, total_seats=ride.total_seats,
        available_seats=ride.available_seats,
        seats=[SeatSchema.model_validate(s) for s in seats],
    )


@router.put("/travellers/{ride_id}", response_model=RideSchema)
def update_traveller(
    ride_id: str,
    request: UpdateTravellerRequest,
    db: Session = Depends(get_db),
    _admin: User = Depends(_require_admin),
):
    ride = db.query(Ride).filter(Ride.id == ride_id, Ride.type == "traveller").first()
    if not ride:
        raise HTTPException(status_code=404, detail="Traveller not found")

    if request.operator_name is not None:
        ride.operator_name = request.operator_name
    if request.departure_time is not None:
        ride.departure_time = request.departure_time
    if request.arrival_time is not None:
        ride.arrival_time = request.arrival_time
    if request.price is not None:
        ride.price = request.price
    if request.is_active is not None:
        ride.is_active = request.is_active

    db.commit()
    db.refresh(ride)

    return RideSchema(
        id=ride.id, type=ride.type, operator_name=ride.operator_name,
        from_city=ride.from_city, to_city=ride.to_city,
        departure_time=ride.departure_time, arrival_time=ride.arrival_time,
        price=ride.price, rating=ride.rating, total_reviews=ride.total_reviews,
        amenities=ride.amenities, total_seats=ride.total_seats,
        available_seats=ride.available_seats,
    )


@router.delete("/travellers/{ride_id}", status_code=status.HTTP_200_OK)
def deactivate_traveller(
    ride_id: str,
    db: Session = Depends(get_db),
    _admin: User = Depends(_require_admin),
):
    ride = db.query(Ride).filter(Ride.id == ride_id, Ride.type == "traveller").first()
    if not ride:
        raise HTTPException(status_code=404, detail="Traveller not found")
    ride.is_active = False
    db.commit()
    return {"message": "Traveller deactivated", "id": ride_id}


# ── Bookings overview ──────────────────────────────────────────────────────────
@router.get("/bookings")
def list_all_bookings(
    db: Session = Depends(get_db),
    _admin: User = Depends(_require_admin),
):
    bookings = db.query(Booking).order_by(Booking.booked_at.desc()).all()
    result = []
    for b in bookings:
        user = db.query(User).filter(User.id == b.user_id).first()
        ride = db.query(Ride).filter(Ride.id == b.ride_id).first()
        result.append({
            "id": b.id,
            "booking_ref": b.booking_ref,
            "status": b.status,
            "payment_status": b.payment_status,
            "seat_numbers": b.seat_numbers,
            "total_price": b.total_price,
            "booked_at": b.booked_at.isoformat() if b.booked_at else None,
            "user": {
                "id": user.id if user else None,
                "name": user.name if user else None,
                "phone": user.phone if user else None,
            },
            "ride": {
                "id": ride.id if ride else None,
                "from_city": ride.from_city if ride else None,
                "to_city": ride.to_city if ride else None,
                "departure_time": ride.departure_time.isoformat() if ride else None,
            },
        })
    return {"bookings": result, "total": len(result)}


# ── Promote user to admin ──────────────────────────────────────────────────────
@router.post("/promote/{phone}")
def promote_user_to_admin(
    phone: str,
    db: Session = Depends(get_db),
    _admin: User = Depends(_require_admin),
):
    user = db.query(User).filter(User.phone == phone).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_admin = True
    db.commit()
    return {"message": f"User {phone} promoted to admin"}
