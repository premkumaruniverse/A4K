import random
import string
from sqlalchemy.orm import Session
from app.models.booking import Booking
from app.models.seat import Seat


def _rand_id(prefix: str, length: int = 10) -> str:
    return prefix + "".join(random.choices(string.ascii_uppercase + string.digits, k=length))


def init_payment(booking_id: str, payment_method: str, db: Session) -> dict:
    """Initialise a payment session (mock implementation)."""
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise ValueError("Booking not found")

    booking.payment_method = payment_method
    db.commit()

    return {
        "payment_id": _rand_id("PAY"),
        "booking_id": booking_id,
        "amount": booking.total_price,
        "status": "pending",
    }


def verify_payment(payment_id: str, booking_id: str, db: Session) -> dict:
    """Confirm payment and update booking + seat statuses (mock — always succeeds)."""
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise ValueError("Booking not found")

    transaction_id = _rand_id("TXN", 12)
    booking.status = "confirmed"
    booking.payment_status = "paid"
    booking.transaction_id = transaction_id

    # Permanently lock seats
    if booking.seat_ids:
        db.query(Seat).filter(Seat.id.in_(booking.seat_ids)).update(
            {"status": "booked"}, synchronize_session=False
        )

    db.commit()

    return {
        "status": "success",
        "booking_id": booking_id,
        "transaction_id": transaction_id,
        "amount": booking.total_price,
        "message": "Payment successful! Your booking is confirmed.",
    }
