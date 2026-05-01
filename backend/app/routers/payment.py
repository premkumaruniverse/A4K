from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.payment import (
    PaymentInitRequest, PaymentInitResponse,
    PaymentVerifyRequest, PaymentVerifyResponse,
)
from app.services.payment_service import init_payment, verify_payment
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/payment", tags=["Payment"])


@router.post("/init", response_model=PaymentInitResponse)
def initialize_payment(
    request: PaymentInitRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        result = init_payment(request.booking_id, request.payment_method, db)
        return PaymentInitResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/verify", response_model=PaymentVerifyResponse)
def verify_payment_endpoint(
    request: PaymentVerifyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        result = verify_payment(request.payment_id, request.booking_id, db)
        return PaymentVerifyResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
