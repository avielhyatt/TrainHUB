import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.booking_utils import busy_bookings_for, overlaps
from app.database import get_db
from app.deps import get_current_user, require_trainer
from app.models import (
    Booking,
    BookingStatus,
    Place,
    Review,
    Slot,
    TrainerPatient,
    TrainerProfile,
    User,
)
from app.schemas import BookingCreate, BookingDecision, BookingOut, PlaceOut, ReviewIn, ReviewOut, UserOut

router = APIRouter(prefix="/bookings", tags=["bookings"])


def _to_out(b: Booking, db: Session) -> BookingOut:
    out = BookingOut.model_validate(b)
    trainer = db.get(User, b.trainer_id)
    patient = db.get(User, b.patient_id)
    place = db.get(Place, b.place_id) if b.place_id else None
    review = db.get(Review, b.id)
    out.trainer = UserOut.model_validate(trainer) if trainer else None
    out.patient = UserOut.model_validate(patient) if patient else None
    if place:
        out.place = PlaceOut.model_validate(place)
    if review:
        out.review = ReviewOut.model_validate(review)
    return out


@router.post("", response_model=BookingOut, status_code=status.HTTP_201_CREATED)
def create_booking(payload: BookingCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    slot = db.get(Slot, payload.slot_id)
    if not slot:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Slot not found")
    if slot.trainer_id == user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot book a session with yourself")
    if slot.end_datetime <= datetime.now(timezone.utc):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This slot is in the past")

    active = (
        db.query(Booking)
        .filter(Booking.slot_id == slot.id, Booking.status.in_([BookingStatus.PENDING, BookingStatus.ACCEPTED]))
        .first()
    )
    if active:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This slot is already requested or booked")

    link = (
        db.query(TrainerPatient)
        .filter(TrainerPatient.trainer_id == slot.trainer_id, TrainerPatient.patient_id == user.id)
        .first()
    )
    if not link:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This trainer has not added you as a patient")

    profile = db.get(TrainerProfile, slot.trainer_id)

    if profile and profile.required_parameters:
        missing = [p for p in profile.required_parameters if not payload.parameter_values.get(p)]
        if missing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Missing required parameters: {', '.join(missing)}")

    if profile and profile.payment_methods and payload.payment_method and payload.payment_method.value not in profile.payment_methods:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This payment method is not accepted by the trainer")

    for b in busy_bookings_for(db, user.id):
        if overlaps(slot.start_datetime, slot.end_datetime, b.start_datetime, b.end_datetime):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="You already have a commitment at this time")

    duration_hours = (slot.end_datetime - slot.start_datetime).total_seconds() / 3600
    cost = round(float(profile.cost_per_hour) * duration_hours, 2) if profile and profile.cost_per_hour else None

    booking = Booking(
        slot_id=slot.id,
        trainer_id=slot.trainer_id,
        patient_id=user.id,
        place_id=slot.place_id,
        start_datetime=slot.start_datetime,
        end_datetime=slot.end_datetime,
        parameter_values=payload.parameter_values,
        cost=cost,
        payment_method=payload.payment_method,
        status=BookingStatus.PENDING,
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return _to_out(booking, db)


@router.get("/mine", response_model=list[BookingOut])
def list_my_bookings(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    bookings = db.query(Booking).filter(Booking.patient_id == user.id).order_by(Booking.start_datetime.desc()).all()
    return [_to_out(b, db) for b in bookings]


@router.post("/{booking_id}/cancel", response_model=BookingOut)
def cancel_booking(booking_id: uuid.UUID, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == booking_id, Booking.patient_id == user.id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    if booking.status not in (BookingStatus.PENDING, BookingStatus.ACCEPTED):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Booking cannot be cancelled")
    booking.status = BookingStatus.CANCELLED
    db.commit()
    db.refresh(booking)
    return _to_out(booking, db)


@router.get("", response_model=list[BookingOut])
def list_trainer_bookings(
    status_filter: BookingStatus | None = Query(default=None, alias="status"),
    user: User = Depends(require_trainer),
    db: Session = Depends(get_db),
):
    query = db.query(Booking).filter(Booking.trainer_id == user.id)
    if status_filter:
        query = query.filter(Booking.status == status_filter)
    bookings = query.order_by(Booking.start_datetime.desc()).all()
    return [_to_out(b, db) for b in bookings]


@router.put("/{booking_id}/decision", response_model=BookingOut)
def decide_booking(booking_id: uuid.UUID, payload: BookingDecision, user: User = Depends(require_trainer), db: Session = Depends(get_db)):
    if payload.status not in (BookingStatus.ACCEPTED, BookingStatus.DECLINED):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Decision must be accepted or declined")
    booking = db.query(Booking).filter(Booking.id == booking_id, Booking.trainer_id == user.id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    if booking.status != BookingStatus.PENDING:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Booking already decided")

    booking.status = payload.status
    booking.decided_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(booking)
    return _to_out(booking, db)


@router.post("/{booking_id}/review", response_model=ReviewOut, status_code=status.HTTP_201_CREATED)
def create_review(booking_id: uuid.UUID, payload: ReviewIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == booking_id, Booking.patient_id == user.id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    if booking.status != BookingStatus.ACCEPTED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only accepted sessions can be reviewed")
    if datetime.now(timezone.utc) < booking.end_datetime:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This session hasn't happened yet")
    if db.get(Review, booking_id):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This session has already been reviewed")

    review = Review(
        booking_id=booking_id,
        trainer_id=booking.trainer_id,
        patient_id=user.id,
        rating=payload.rating,
        comment=payload.comment,
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return review
