from sqlalchemy import Column, String, DateTime, Float, Integer, Boolean, Text
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import json
from app.database import Base


class Ride(Base):
    __tablename__ = "rides"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    type = Column(String(15), nullable=False, index=True)          # bus/cab/auto/traveller
    operator_name = Column(String(100), nullable=True)
    from_city = Column(String(100), nullable=False, index=True)
    to_city = Column(String(100), nullable=False, index=True)
    departure_time = Column(DateTime, nullable=False, index=True)
    arrival_time = Column(DateTime, nullable=False)
    price = Column(Float, nullable=False)
    rating = Column(Float, default=4.0)
    total_reviews = Column(Integer, default=0)
    amenities_json = Column(Text, default="[]")
    total_seats = Column(Integer, default=40)
    available_seats = Column(Integer, default=40)
    image_url = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    seats = relationship("Seat", back_populates="ride", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="ride")

    @property
    def amenities(self):
        try:
            return json.loads(self.amenities_json)
        except Exception:
            return []

    @amenities.setter
    def amenities(self, value):
        self.amenities_json = json.dumps(value)
