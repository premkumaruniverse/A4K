from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta

from app.database import get_db
from app.models.user import User
from app.schemas.auth import (
    SendOTPRequest, SendOTPResponse,
    VerifyOTPRequest, AuthResponse, UserResponse,
    UpdateProfileRequest,
)
from app.services.otp_service import send_otp, verify_otp
from app.utils.auth import create_access_token
from app.utils.dependencies import get_current_user
from app.config import settings

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/send-otp", response_model=SendOTPResponse)
def send_otp_endpoint(request: SendOTPRequest, db: Session = Depends(get_db)):
    otp, is_debug = send_otp(request.phone, db)
    return SendOTPResponse(
        message=f"OTP sent to +91{request.phone}",
        expires_in=settings.OTP_EXPIRE_SECONDS,
        dev_otp=otp if is_debug else None,
    )


@router.post("/verify-otp", response_model=AuthResponse)
def verify_otp_endpoint(request: VerifyOTPRequest, db: Session = Depends(get_db)):
    if not verify_otp(request.phone, request.otp, db):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP. Please try again.",
        )

    user = db.query(User).filter(User.phone == request.phone).first()
    if not user:
        user = User(phone=request.phone)
        db.add(user)
        db.commit()
        db.refresh(user)

    access_token = create_access_token(
        data={"sub": user.id, "phone": user.phone},
        expires_delta=timedelta(minutes=settings.JWT_EXPIRE_MINUTES),
    )
    return AuthResponse(access_token=access_token, user=UserResponse.model_validate(user))


@router.get("/me", response_model=UserResponse)
def get_profile(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)


@router.put("/me", response_model=UserResponse)
def update_profile(
    request: UpdateProfileRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if request.name is not None:
        current_user.name = request.name
    if request.email is not None:
        current_user.email = request.email
    db.commit()
    db.refresh(current_user)
    return UserResponse.model_validate(current_user)
