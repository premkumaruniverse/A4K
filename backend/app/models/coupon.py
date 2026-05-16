from sqlalchemy import Column, String, Float, Boolean
from app.database import Base
import uuid

class Coupon(Base):
    __tablename__ = "coupons"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    code = Column(String(50), unique=True, index=True, nullable=False)
    discount_amount = Column(Float, nullable=False)
    is_active = Column(Boolean, default=True)
