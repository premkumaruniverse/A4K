from pydantic import BaseModel, field_validator
from typing import Optional
import re


class SendOTPRequest(BaseModel):
    phone: str

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        v = v.strip().replace("+91", "").replace("-", "").replace(" ", "")
        if not re.match(r"^\d{10}$", v):
            raise ValueError("Enter a valid 10-digit mobile number")
        return v


class SendOTPResponse(BaseModel):
    message: str
    expires_in: int
    dev_otp: Optional[str] = None   # Visible only in DEBUG mode


class VerifyOTPRequest(BaseModel):
    phone: str
    otp: str

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        return v.strip().replace("+91", "").replace("-", "").replace(" ", "")

    @field_validator("otp")
    @classmethod
    def validate_otp(cls, v: str) -> str:
        if not re.match(r"^\d{6}$", v.strip()):
            raise ValueError("OTP must be exactly 6 digits")
        return v.strip()


class UserResponse(BaseModel):
    id: str
    phone: str
    name: Optional[str] = None
    email: Optional[str] = None

    model_config = {"from_attributes": True}


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
