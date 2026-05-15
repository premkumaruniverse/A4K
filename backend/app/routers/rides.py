from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime

from app.database import get_db
from app.models.ride import Ride
from app.models.seat import Seat
from app.schemas.ride import RideSchema, RideDetailSchema, SeatSchema

router = APIRouter(prefix="/rides", tags=["Rides"])

# ── Fixed routes only ──────────────────────────────────────────────────────────
VALID_ROUTES = [
    {"from": "Kharagpur", "to": "Kolkata Airport"},
    {"from": "Kolkata Airport", "to": "Kharagpur"},
]

ROUTE_KEYS = {
    "KGP_CCU": {"from": "Kharagpur",       "to": "Kolkata Airport"},
    "CCU_KGP": {"from": "Kolkata Airport", "to": "Kharagpur"},
}


def _is_valid_route(from_city: str, to_city: str) -> bool:
    for r in VALID_ROUTES:
        if r["from"].lower() == from_city.lower() and r["to"].lower() == to_city.lower():
            return True
    return False


# ── Routes ─────────────────────────────────────────────────────────────────────
@router.get("/routes")
def get_routes():
    """Return the two fixed routes available."""
    return {"routes": VALID_ROUTES}



def _release_expired_seats(db: Session, ride_id: Optional[str] = None):
    """Release any seats that have been locked for more than 5 minutes."""
    from datetime import timedelta
    expired_threshold = datetime.utcnow() - timedelta(minutes=5)
    
    query = db.query(Seat).filter(
        Seat.status == "locked",
        Seat.locked_at <= expired_threshold
    )
    if ride_id:
        query = query.filter(Seat.ride_id == ride_id)
    
    expired_seats = query.all()
    if not expired_seats:
        return

    # Group by ride_id to update available_seats
    ride_counts = {}
    for s in expired_seats:
        s.status = "available"
        s.locked_at = None
        ride_counts[s.ride_id] = ride_counts.get(s.ride_id, 0) + 1
    
    for rid, count in ride_counts.items():
        ride = db.query(Ride).filter(Ride.id == rid).first()
        if ride:
            ride.available_seats = min(ride.total_seats, ride.available_seats + count)
    
    db.commit()


@router.get("", response_model=List[RideSchema])
def search_travellers(
    from_city: str = Query(..., alias="from"),
    to_city: str = Query(..., alias="to"),
    travel_date: Optional[str] = Query(None, alias="date"),
    db: Session = Depends(get_db),
):
    """Search travellers on fixed routes only."""
    if not _is_valid_route(from_city, to_city):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid route. Only Kharagpur ↔ Kolkata Airport is supported.",
        )

    query = db.query(Ride).filter(
        Ride.from_city.ilike(f"%{from_city}%"),
        Ride.to_city.ilike(f"%{to_city}%"),
        Ride.type == "traveller",
        Ride.is_active == True,
    )

    if travel_date:
        try:
            dt = datetime.strptime(travel_date, "%Y-%m-%d")
            dt_start = dt.replace(hour=0, minute=0, second=0)
            dt_end = dt.replace(hour=23, minute=59, second=59)
            
            # If searching for today, don't show past rides
            now = datetime.utcnow()
            effective_start = max(dt_start, now)
            
            query = query.filter(
                Ride.departure_time >= effective_start,
                Ride.departure_time <= dt_end,
            )
        except ValueError:
            pass
    else:
        query = query.filter(Ride.departure_time >= datetime.utcnow())

    _release_expired_seats(db)

    rides = query.order_by(Ride.departure_time).all()

    results = []
    for r in rides:
        results.append(RideSchema(
            id=r.id, type=r.type, operator_name=r.operator_name,
            from_city=r.from_city, to_city=r.to_city,
            departure_time=r.departure_time, arrival_time=r.arrival_time,
            price=r.price, rating=r.rating, total_reviews=r.total_reviews,
            amenities=r.amenities, total_seats=r.total_seats,
            available_seats=r.available_seats,
            image_url=r.image_url,
        ))
    return results


@router.get("/{ride_id}", response_model=RideDetailSchema)
def get_ride_detail(ride_id: str, db: Session = Depends(get_db)):
    ride = db.query(Ride).filter(Ride.id == ride_id, Ride.is_active == True).first()
    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found")

    _release_expired_seats(db, ride_id)

    seats = (
        db.query(Seat)
        .filter(Seat.ride_id == ride_id)
        .order_by(Seat.seat_number)
        .all()
    )

    return RideDetailSchema(
        id=ride.id, type=ride.type, operator_name=ride.operator_name,
        from_city=ride.from_city, to_city=ride.to_city,
        departure_time=ride.departure_time, arrival_time=ride.arrival_time,
        price=ride.price, rating=ride.rating, total_reviews=ride.total_reviews,
        amenities=ride.amenities, total_seats=ride.total_seats,
        available_seats=ride.available_seats,
        image_url=ride.image_url,
        seats=[SeatSchema.model_validate(s) for s in seats],
    )
