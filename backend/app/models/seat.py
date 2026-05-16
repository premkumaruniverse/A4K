from sqlalchemy import Column, String, ForeignKey, UniqueConstraint, DateTime, Float
from sqlalchemy.orm import relationship
import uuid
from app.database import Base


class Seat(Base):
    __tablename__ = "seats"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    ride_id = Column(String(36), ForeignKey("rides.id"), nullable=False, index=True)
    seat_number = Column(String(5), nullable=False)   # e.g. "1", "2", … "17"
    seat_type = Column(String(20), default="seater")
    # available / locked / booked
    status = Column(String(10), default="available", index=True)
    locked_at = Column(DateTime, nullable=True)       # timestamp when locked (saga step 1)
    price = Column(Float, nullable=True)

    ride = relationship("Ride", back_populates="seats")

    __table_args__ = (
        UniqueConstraint("ride_id", "seat_number", name="uq_ride_seat"),
    )
