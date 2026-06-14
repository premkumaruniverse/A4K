from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta
import random
import string

from app.database import get_db
from app.models.booking import Booking, Passenger
from app.models.ride import Ride
from app.models.seat import Seat
from app.models.user import User
from app.schemas.booking import (
    CreateBookingRequest, BookingResponse,
    RideBasicSchema, PassengerResponse,
    LockSeatRequest, LockSeatResponse,
)
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/bookings", tags=["Bookings"])

SEAT_LOCK_MINUTES = 5   # Saga Step 1 lock duration


def _gen_ref() -> str:
    return "RB" + "".join(random.choices(string.ascii_uppercase + string.digits, k=8))


def _build_response(booking: Booking, ride) -> BookingResponse:
    passengers = [
        PassengerResponse(id=p.id, name=p.name, age=p.age, gender=p.gender)
        for p in booking.passengers
    ]
    ride_basic = None
    if ride:
        ride_basic = RideBasicSchema(
            id=ride.id, type=ride.type, operator_name=ride.operator_name,
            from_city=ride.from_city, to_city=ride.to_city,
            departure_time=ride.departure_time, arrival_time=ride.arrival_time,
            price=ride.price,
        )
    return BookingResponse(
        id=booking.id, booking_ref=booking.booking_ref,
        user_id=booking.user_id, ride_id=booking.ride_id,
        ride=ride_basic, seat_numbers=booking.seat_numbers,
        total_price=booking.total_price, base_fare=booking.base_fare,
        taxes=booking.taxes, passenger_count=booking.passenger_count,
        status=booking.status, payment_status=booking.payment_status,
        payment_method=booking.payment_method,
        transaction_id=booking.transaction_id,
        cab_number=booking.cab_number,
        booked_at=booking.booked_at, cancelled_at=booking.cancelled_at,
        passengers=passengers,
    )


# ── Saga Step 1: Temporarily lock a seat ──────────────────────────────────────
@router.post("/lock-seat", response_model=LockSeatResponse, status_code=status.HTTP_200_OK)
def lock_seat(request: LockSeatRequest, db: Session = Depends(get_db)):
    """
    Temporarily lock a seat for the Saga flow.
    No authentication required — done before login step.
    Seat will auto-release after SEAT_LOCK_MINUTES.
    """
    seat = db.query(Seat).filter(
        Seat.id == request.seat_id,
        Seat.ride_id == request.ride_id,
    ).with_for_update().first()

    if not seat:
        raise HTTPException(status_code=404, detail="Seat not found")

    # Release if expired lock
    if seat.status == "locked" and seat.locked_at:
        if datetime.utcnow() - seat.locked_at > timedelta(minutes=SEAT_LOCK_MINUTES):
            seat.status = "available"
            seat.locked_at = None
            db.commit()

    if seat.status != "available":
        raise HTTPException(
            status_code=409,
            detail="Seat is no longer available. Please choose another seat.",
        )

    seat.status = "locked"
    seat.locked_at = datetime.utcnow()

    ride = db.query(Ride).filter(Ride.id == request.ride_id).first()
    if ride:
        ride.available_seats = max(0, ride.available_seats - 1)

    db.commit()
    db.refresh(seat)

    expires_at = seat.locked_at + timedelta(minutes=SEAT_LOCK_MINUTES)
    return LockSeatResponse(
        seat_id=seat.id,
        seat_number=seat.seat_number,
        ride_id=request.ride_id,
        locked_at=seat.locked_at,
        expires_at=expires_at,
        lock_duration_seconds=SEAT_LOCK_MINUTES * 60,
    )


# ── Saga Compensation: Release a locked seat ──────────────────────────────────
@router.delete("/release-seat/{seat_id}", status_code=status.HTTP_200_OK)
def release_seat(seat_id: str, db: Session = Depends(get_db)):
    """
    Release a temporarily locked seat (Saga rollback / compensation).
    No authentication required — user may not be logged in yet.
    """
    seat = db.query(Seat).filter(Seat.id == seat_id).first()
    if not seat:
        raise HTTPException(status_code=404, detail="Seat not found")

    if seat.status == "locked":
        seat.status = "available"
        seat.locked_at = None

        ride = db.query(Ride).filter(Ride.id == seat.ride_id).first()
        if ride:
            ride.available_seats = min(ride.total_seats, ride.available_seats + 1)

        db.commit()

    return {"message": "Seat released successfully", "seat_id": seat_id}


# ── Create booking (Saga Step 3: after payment init) ──────────────────────────
@router.post("", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
def create_booking(
    request: CreateBookingRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if request.cab_id:
        from app.models.cab import Cab
        cab = db.query(Cab).filter(Cab.id == request.cab_id, Cab.is_active == True).first()
        if not cab:
            raise HTTPException(status_code=404, detail="Cab not found")
        
        # Create a dynamic Ride entry of type "cab"
        ride = Ride(
            type="cab",
            operator_name=cab.name,
            from_city=request.from_city or "Kharagpur",
            to_city=request.to_city or "Kolkata Airport",
            departure_time=datetime.utcnow(),
            arrival_time=datetime.utcnow() + timedelta(minutes=90),
            price=cab.fare,
            rating=cab.rating,
            total_reviews=cab.total_reviews,
            total_seats=cab.capacity,
            available_seats=0,
            image_url=cab.image_url,
            is_active=True,
        )
        db.add(ride)
        db.flush()

        passenger_count = max(len(request.passengers), 1)
        base_fare = round(cab.fare * passenger_count, 2)
        taxes = round(base_fare * 0.05, 2)
        total_price = round(base_fare + taxes, 2)

        booking = Booking(
            booking_ref=_gen_ref(),
            user_id=current_user.id,
            ride_id=ride.id,
            total_price=total_price,
            base_fare=base_fare,
            taxes=taxes,
            passenger_count=passenger_count,
            status="pending",
            payment_status="pending",
            payment_method=request.payment_method,
            cab_number=cab.cab_number or "Not Assigned",
        )
        booking.seat_ids = []
        booking.seat_numbers = ["—"]

        db.add(booking)
        db.flush()

        for p in request.passengers:
            db.add(Passenger(booking_id=booking.id, name=p.name, age=p.age, gender=p.gender))

        db.commit()
        db.refresh(booking)
        return _build_response(booking, ride)

    # Standard fixed-route ride booking flow
    if not request.ride_id:
        raise HTTPException(status_code=400, detail="Either ride_id or cab_id is required.")

    ride = db.query(Ride).filter(Ride.id == request.ride_id, Ride.is_active == True).first()
    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found")

    if not request.seat_ids:
        raise HTTPException(status_code=400, detail="Seat selection is required.")

    seats = db.query(Seat).filter(
        Seat.id.in_(request.seat_ids), Seat.ride_id == ride.id
    ).all()

    if len(seats) != len(request.seat_ids):
        raise HTTPException(status_code=400, detail="One or more selected seats are invalid")

    seat_ids, seat_numbers = [], []
    for seat in seats:
        if seat.status not in ("available", "locked"):
            raise HTTPException(
                status_code=409,
                detail=f"Seat {seat.seat_number} is no longer available.",
            )
        seat.status = "blocked"
        seat.locked_at = None
        seat_ids.append(seat.id)
        seat_numbers.append(seat.seat_number)

    passenger_count = max(len(request.passengers), 1)
    base_fare = round(ride.price * passenger_count, 2)
    taxes = round(base_fare * 0.05, 2)
    total_price = round(base_fare + taxes, 2)

    booking = Booking(
        booking_ref=_gen_ref(),
        user_id=current_user.id,
        ride_id=ride.id,
        total_price=total_price,
        base_fare=base_fare,
        taxes=taxes,
        passenger_count=passenger_count,
        status="pending",
        payment_status="pending",
        payment_method=request.payment_method,
    )
    booking.seat_ids = seat_ids
    booking.seat_numbers = seat_numbers

    db.add(booking)
    db.flush()

    for p in request.passengers:
        db.add(Passenger(booking_id=booking.id, name=p.name, age=p.age, gender=p.gender))

    db.commit()
    db.refresh(booking)
    return _build_response(booking, ride)


@router.get("/me", response_model=List[BookingResponse])
def get_my_bookings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    bookings = (
        db.query(Booking)
        .filter(Booking.user_id == current_user.id)
        .order_by(Booking.booked_at.desc())
        .all()
    )
    results = []
    for b in bookings:
        ride = db.query(Ride).filter(Ride.id == b.ride_id).first()
        results.append(_build_response(b, ride))
    return results


@router.get("/{booking_id}", response_model=BookingResponse)
def get_booking(
    booking_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    booking = db.query(Booking).filter(
        Booking.id == booking_id, Booking.user_id == current_user.id
    ).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    ride = db.query(Ride).filter(Ride.id == booking.ride_id).first()
    return _build_response(booking, ride)


@router.patch("/{booking_id}/cancel", response_model=BookingResponse)
def cancel_booking(
    booking_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    booking = db.query(Booking).filter(
        Booking.id == booking_id, Booking.user_id == current_user.id
    ).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.status not in ("pending", "confirmed"):
        raise HTTPException(status_code=400, detail="This booking cannot be cancelled")

    ride = db.query(Ride).filter(Ride.id == booking.ride_id).first()

    if booking.seat_ids:
        db.query(Seat).filter(Seat.id.in_(booking.seat_ids)).update(
            {"status": "available", "locked_at": None}, synchronize_session=False
        )
        if ride:
            ride.available_seats = min(ride.total_seats, ride.available_seats + len(booking.seat_ids))

    booking.status = "cancelled"
    booking.payment_status = "refunded" if booking.payment_status == "paid" else "cancelled"
    booking.cancelled_at = datetime.utcnow()

    db.commit()
    db.refresh(booking)
    return _build_response(booking, ride)
