from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class SeatSchema(BaseModel):
    id: str
    seat_number: str
    seat_type: str
    status: str   # available / locked / booked

    model_config = {"from_attributes": True}


class RideSchema(BaseModel):
    id: str
    type: str
    operator_name: Optional[str] = None
    from_city: str
    to_city: str
    departure_time: datetime
    arrival_time: datetime
    price: float
    rating: float
    total_reviews: int
    amenities: List[str] = []
    total_seats: int
    available_seats: int

    model_config = {"from_attributes": True}


class RideDetailSchema(RideSchema):
    seats: List[SeatSchema] = []

    model_config = {"from_attributes": True}


# ── Admin schemas ──────────────────────────────────────────────────────────────
class CreateTravellerRequest(BaseModel):
    from_city: str
    to_city: str
    operator_name: Optional[str] = "KGP Shuttle Service"
    departure_time: datetime
    arrival_time: datetime
    price: float
    total_seats: int = 17


class UpdateTravellerRequest(BaseModel):
    operator_name: Optional[str] = None
    departure_time: Optional[datetime] = None
    arrival_time: Optional[datetime] = None
    price: Optional[float] = None
    total_seats: Optional[int] = None
    is_active: Optional[bool] = None
