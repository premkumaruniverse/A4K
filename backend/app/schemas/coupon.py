from pydantic import BaseModel
from typing import Optional

class CouponBase(BaseModel):
    code: str
    discount_amount: float
    is_active: bool = True

class CouponCreate(CouponBase):
    pass

class CouponUpdate(BaseModel):
    code: Optional[str] = None
    discount_amount: Optional[float] = None
    is_active: Optional[bool] = None

class CouponSchema(CouponBase):
    id: str

    class Config:
        from_attributes = True
