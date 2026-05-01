from pydantic import BaseModel
from typing import Optional


class PaymentInitRequest(BaseModel):
    booking_id: str
    payment_method: str   # upi / card


class PaymentInitResponse(BaseModel):
    payment_id: str
    booking_id: str
    amount: float
    status: str


class PaymentVerifyRequest(BaseModel):
    payment_id: str
    booking_id: str


class PaymentVerifyResponse(BaseModel):
    status: str
    booking_id: str
    transaction_id: str
    amount: float
    message: str
