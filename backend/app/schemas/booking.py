from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import datetime


class PassengerInput(BaseModel):
    name: str
    age: int
    gender: str  # male/female/other

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        if len(v.strip()) < 2:
            raise ValueError("Name must be at least 2 characters")
        return v.strip()

    @field_validator("age")
    @classmethod
    def validate_age(cls, v: int) -> int:
        if v < 1 or v > 120:
            raise ValueError("Age must be between 1 and 120")
        return v

    @field_validator("gender")
    @classmethod
    def validate_gender(cls, v: str) -> str:
        if v.lower() not in ["male", "female", "other"]:
            raise ValueError("Gender must be male, female, or other")
        return v.lower()


class CreateBookingRequest(BaseModel):
    ride_id: Optional[str] = None
    cab_id: Optional[str] = None
    from_city: Optional[str] = None
    to_city: Optional[str] = None
    seat_ids: List[str] = []
    passengers: List[PassengerInput] = []
    payment_method: str = "upi"


class LockSeatRequest(BaseModel):
    seat_id: str
    ride_id: str


class LockSeatResponse(BaseModel):
    seat_id: str
    seat_number: str
    ride_id: str
    locked_at: datetime
    expires_at: datetime
    lock_duration_seconds: int


class PassengerResponse(BaseModel):
    id: str
    name: str
    age: int
    gender: str

    model_config = {"from_attributes": True}


class RideBasicSchema(BaseModel):
    id: str
    type: str
    operator_name: Optional[str] = None
    from_city: str
    to_city: str
    departure_time: datetime
    arrival_time: datetime
    price: float

    model_config = {"from_attributes": True}


class BookingResponse(BaseModel):
    id: str
    booking_ref: str
    user_id: str
    ride_id: str
    ride: Optional[RideBasicSchema] = None
    seat_numbers: List[str] = []
    total_price: float
    base_fare: float
    taxes: float
    passenger_count: int
    status: str
    payment_status: str
    payment_method: Optional[str] = None
    transaction_id: Optional[str] = None
    cab_number: Optional[str] = None
    booked_at: datetime
    cancelled_at: Optional[datetime] = None
    passengers: List[PassengerResponse] = []

    model_config = {"from_attributes": True}
