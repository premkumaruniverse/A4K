from sqlalchemy import Column, String, Float, DateTime, Text, ForeignKey, Integer
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import json
from app.database import Base


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    booking_ref = Column(String(20), unique=True, nullable=False)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    ride_id = Column(String(36), ForeignKey("rides.id"), nullable=False)
    seat_ids_json = Column(Text, default="[]")
    seat_numbers_json = Column(Text, default="[]")
    total_price = Column(Float, nullable=False)
    base_fare = Column(Float, nullable=False)
    taxes = Column(Float, nullable=False)
    passenger_count = Column(Integer, default=1)
    status = Column(String(20), default="pending")           # pending/confirmed/cancelled/completed
    payment_status = Column(String(20), default="pending")   # pending/paid/failed/refunded
    payment_method = Column(String(30), nullable=True)
    transaction_id = Column(String(100), nullable=True)
    cab_number = Column(String(50), nullable=True)
    booked_at = Column(DateTime, default=datetime.utcnow)
    cancelled_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="bookings")
    ride = relationship("Ride", back_populates="bookings")
    passengers = relationship("Passenger", back_populates="booking", cascade="all, delete-orphan")

    @property
    def seat_ids(self):
        try:
            return json.loads(self.seat_ids_json)
        except Exception:
            return []

    @seat_ids.setter
    def seat_ids(self, value):
        self.seat_ids_json = json.dumps(value)

    @property
    def seat_numbers(self):
        try:
            return json.loads(self.seat_numbers_json)
        except Exception:
            return []

    @seat_numbers.setter
    def seat_numbers(self, value):
        self.seat_numbers_json = json.dumps(value)


class Passenger(Base):
    __tablename__ = "passengers"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    booking_id = Column(String(36), ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String(10), nullable=False)  # male/female/other

    booking = relationship("Booking", back_populates="passengers")
