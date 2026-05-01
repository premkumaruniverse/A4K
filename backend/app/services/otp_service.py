import random
import string
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.user import OTPStore
from app.config import settings


def generate_otp() -> str:
    return "".join(random.choices(string.digits, k=6))


def send_otp(phone: str, db: Session) -> tuple:
    """Generate & store OTP. Returns (otp_code, is_debug_mode)."""
    otp = generate_otp()
    expires_at = datetime.utcnow() + timedelta(seconds=settings.OTP_EXPIRE_SECONDS)

    existing = db.query(OTPStore).filter(OTPStore.phone == phone).first()
    if existing:
        existing.otp = otp
        existing.expires_at = expires_at
        existing.attempts = 0
        existing.created_at = datetime.utcnow()
    else:
        record = OTPStore(phone=phone, otp=otp, expires_at=expires_at)
        db.add(record)

    db.commit()

    # In production: call Twilio / MSG91 / Fast2SMS here
    print(f"\n{'='*40}")
    print(f"  OTP SERVICE  |  Phone: +91{phone}  |  OTP: {otp}")
    print(f"{'='*40}\n")

    return otp, settings.DEBUG


def verify_otp(phone: str, otp: str, db: Session) -> bool:
    """Verify submitted OTP. Returns True if valid."""
    record = db.query(OTPStore).filter(OTPStore.phone == phone).first()

    if not record:
        return False

    # Too many attempts → blacklist
    if record.attempts >= 5:
        db.delete(record)
        db.commit()
        return False

    # Expired
    if datetime.utcnow() > record.expires_at:
        db.delete(record)
        db.commit()
        return False

    # Wrong OTP
    if record.otp != otp:
        record.attempts += 1
        db.commit()
        return False

    # Valid → consume
    db.delete(record)
    db.commit()
    return True
