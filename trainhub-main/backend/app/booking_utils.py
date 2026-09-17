import uuid

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models import Booking, BookingStatus


def overlaps(a_start, a_end, b_start, b_end) -> bool:
    return a_start < b_end and b_start < a_end


def busy_bookings_for(db: Session, party_id: uuid.UUID) -> list[Booking]:
    """Every active commitment a user has, whether they're the trainer or the patient on the booking."""
    return (
        db.query(Booking)
        .filter(
            or_(Booking.patient_id == party_id, Booking.trainer_id == party_id),
            Booking.status.in_([BookingStatus.PENDING, BookingStatus.ACCEPTED]),
        )
        .all()
    )
