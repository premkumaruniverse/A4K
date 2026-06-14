from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, Text
from datetime import datetime
import uuid
import json
from app.database import Base


class Cab(Base):
    __tablename__ = "cabs"

    id = Column(String(36), primary_key=True, default=lambda: "cab-" + str(uuid.uuid4())[:8])
    name = Column(String(100), nullable=False)
    type = Column(String(50), nullable=False)  # Sedan, SUV, etc.
    image_url = Column(Text, nullable=True)
    cab_number = Column(String(50), nullable=True)
    
    # Driver sub-fields
    driver_name = Column(String(100), nullable=False)
    driver_phone = Column(String(20), nullable=False)
    driver_rating = Column(Float, default=4.5)
    driver_trips = Column(Integer, default=0)

    rating = Column(Float, default=4.5)
    total_reviews = Column(Integer, default=0)
    eta_minutes = Column(Integer, default=5)
    fare = Column(Float, nullable=False)
    capacity = Column(Integer, default=4)
    amenities_json = Column(Text, default="[]")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    @property
    def amenities(self):
        try:
            return json.loads(self.amenities_json)
        except Exception:
            return []

    @amenities.setter
    def amenities(self, value):
        self.amenities_json = json.dumps(value)
