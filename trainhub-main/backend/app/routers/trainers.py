import uuid
from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
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
    UserRole,
)
from app.schemas import (
    AvailabilitySlot,
    PatientAdd,
    PatientOut,
    PlaceIn,
    PlaceOut,
    SlotBookingSummary,
    SlotDetailOut,
    SlotIn,
    SlotOut,
    TrainerProfileIn,
    TrainerProfileOut,
    TrainerPublicOut,
    TrainerReviewOut,
    UserOut,
)

router = APIRouter(prefix="/trainers", tags=["trainers"])


def _ensure_relationship_or_self(db: Session, trainer_id: uuid.UUID, user: User):
    if user.id == trainer_id:
        return
    link = (
        db.query(TrainerPatient)
        .filter(TrainerPatient.trainer_id == trainer_id, TrainerPatient.patient_id == user.id)
        .first()
    )
    if not link:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No relationship with this trainer")


def _rating_stats(db: Session, trainer_id: uuid.UUID) -> tuple[float | None, int]:
    avg_rating, review_count = (
        db.query(func.avg(Review.rating), func.count(Review.booking_id))
        .filter(Review.trainer_id == trainer_id)
        .one()
    )
    return (round(float(avg_rating), 2) if avg_rating is not None else None, review_count or 0)


# ---------- Own profile ----------

@router.get("/me/profile", response_model=TrainerProfileOut)
def get_my_profile(user: User = Depends(require_trainer), db: Session = Depends(get_db)):
    profile = db.get(TrainerProfile, user.id)
    if not profile:
        profile = TrainerProfile(user_id=user.id, required_parameters=[], payment_methods=[])
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile


@router.put("/me/profile", response_model=TrainerProfileOut)
def update_my_profile(payload: TrainerProfileIn, user: User = Depends(require_trainer), db: Session = Depends(get_db)):
    profile = db.get(TrainerProfile, user.id)
    if not profile:
        profile = TrainerProfile(user_id=user.id)
        db.add(profile)
    profile.specialty = payload.specialty
    profile.description = payload.description
    profile.required_parameters = payload.required_parameters
    profile.cost_per_hour = payload.cost_per_hour
    profile.payment_methods = [p.value for p in payload.payment_methods]
    profile.is_public = payload.is_public
    db.commit()
    db.refresh(profile)
    return profile


@router.get("/{trainer_id}", response_model=TrainerPublicOut)
def get_trainer_public(trainer_id: uuid.UUID, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    trainer = db.get(User, trainer_id)
    if not trainer or trainer.role != UserRole.TRAINER:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trainer not found")
    _ensure_relationship_or_self(db, trainer_id, user)
    profile = db.get(TrainerProfile, trainer_id)
    avg_rating, review_count = _rating_stats(db, trainer_id)
    return TrainerPublicOut(
        user=UserOut.model_validate(trainer), profile=profile, avg_rating=avg_rating, review_count=review_count
    )


# ---------- Places ----------

@router.get("/me/places", response_model=list[PlaceOut])
def list_my_places(user: User = Depends(require_trainer), db: Session = Depends(get_db)):
    return db.query(Place).filter(Place.trainer_id == user.id).order_by(Place.created_at).all()


@router.post("/me/places", response_model=PlaceOut, status_code=status.HTTP_201_CREATED)
def add_place(payload: PlaceIn, user: User = Depends(require_trainer), db: Session = Depends(get_db)):
    place = Place(
        trainer_id=user.id,
        name=payload.name,
        address=payload.address,
        details=payload.details,
        latitude=payload.latitude,
        longitude=payload.longitude,
    )
    db.add(place)
    db.commit()
    db.refresh(place)
    return place


@router.delete("/me/places/{place_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_place(place_id: uuid.UUID, user: User = Depends(require_trainer), db: Session = Depends(get_db)):
    place = db.query(Place).filter(Place.id == place_id, Place.trainer_id == user.id).first()
    if not place:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Place not found")
    db.delete(place)
    db.commit()


@router.get("/{trainer_id}/places", response_model=list[PlaceOut])
def list_trainer_places(trainer_id: uuid.UUID, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _ensure_relationship_or_self(db, trainer_id, user)
    return db.query(Place).filter(Place.trainer_id == trainer_id).order_by(Place.created_at).all()


# ---------- Slots ----------

def _active_booking_for_slot(db: Session, slot_id: uuid.UUID) -> Booking | None:
    return (
        db.query(Booking)
        .filter(Booking.slot_id == slot_id, Booking.status.in_([BookingStatus.PENDING, BookingStatus.ACCEPTED]))
        .first()
    )


def _slot_detail(db: Session, slot: Slot) -> SlotDetailOut:
    out = SlotDetailOut.model_validate(slot)
    booking = _active_booking_for_slot(db, slot.id)
    out.is_available = booking is None and slot.end_datetime > datetime.now(timezone.utc)
    if booking:
        patient = db.get(User, booking.patient_id)
        out.booking = SlotBookingSummary(
            booking_id=booking.id,
            status=booking.status,
            patient=UserOut.model_validate(patient) if patient else None,
        )
    return out


@router.get("/me/slots", response_model=list[SlotDetailOut])
def list_my_slots(
    start_date: date = Query(default_factory=date.today),
    end_date: date | None = Query(default=None),
    user: User = Depends(require_trainer),
    db: Session = Depends(get_db),
):
    if end_date is None:
        end_date = start_date + timedelta(days=60)
    range_start = datetime.combine(start_date, datetime.min.time(), tzinfo=timezone.utc)
    range_end = datetime.combine(end_date, datetime.max.time(), tzinfo=timezone.utc)
    slots = (
        db.query(Slot)
        .filter(Slot.trainer_id == user.id, Slot.end_datetime >= range_start, Slot.start_datetime <= range_end)
        .order_by(Slot.start_datetime)
        .all()
    )
    return [_slot_detail(db, s) for s in slots]


@router.post("/me/slots", response_model=SlotOut, status_code=status.HTTP_201_CREATED)
def add_slot(payload: SlotIn, user: User = Depends(require_trainer), db: Session = Depends(get_db)):
    start = payload.start_datetime if payload.start_datetime.tzinfo else payload.start_datetime.replace(tzinfo=timezone.utc)
    end = payload.end_datetime if payload.end_datetime.tzinfo else payload.end_datetime.replace(tzinfo=timezone.utc)

    if start >= end:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="start_datetime must be before end_datetime")
    if end <= datetime.now(timezone.utc):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Slot must be in the future")

    if payload.place_id:
        place = db.query(Place).filter(Place.id == payload.place_id, Place.trainer_id == user.id).first()
        if not place:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Place not found")

    other_slots = db.query(Slot).filter(Slot.trainer_id == user.id).all()
    for s in other_slots:
        if overlaps(start, end, s.start_datetime, s.end_datetime):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This overlaps another slot you already created")

    for b in busy_bookings_for(db, user.id):
        if overlaps(start, end, b.start_datetime, b.end_datetime):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="You already have a commitment at this time")

    slot = Slot(trainer_id=user.id, place_id=payload.place_id, start_datetime=start, end_datetime=end)
    db.add(slot)
    db.commit()
    db.refresh(slot)
    return slot


@router.delete("/me/slots/{slot_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_slot(slot_id: uuid.UUID, user: User = Depends(require_trainer), db: Session = Depends(get_db)):
    slot = db.query(Slot).filter(Slot.id == slot_id, Slot.trainer_id == user.id).first()
    if not slot:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Slot not found")
    if _active_booking_for_slot(db, slot_id):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This slot has a pending or accepted request; decide or cancel it first",
        )
    db.delete(slot)
    db.commit()


@router.get("/{trainer_id}/slots", response_model=list[SlotOut])
def list_trainer_slots(
    trainer_id: uuid.UUID,
    start_date: date = Query(default_factory=date.today),
    end_date: date | None = Query(default=None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _ensure_relationship_or_self(db, trainer_id, user)
    if end_date is None:
        end_date = start_date + timedelta(days=60)
    range_start = datetime.combine(start_date, datetime.min.time(), tzinfo=timezone.utc)
    range_end = datetime.combine(end_date, datetime.max.time(), tzinfo=timezone.utc)
    slots = (
        db.query(Slot)
        .filter(Slot.trainer_id == trainer_id, Slot.end_datetime >= range_start, Slot.start_datetime <= range_end)
        .order_by(Slot.start_datetime)
        .all()
    )
    now = datetime.now(timezone.utc)
    available = [s for s in slots if s.end_datetime > now and _active_booking_for_slot(db, s.id) is None]
    return available


@router.get("/me/busy-times", response_model=list[AvailabilitySlot])
def my_busy_times(
    start_date: date = Query(default_factory=date.today),
    end_date: date | None = Query(default=None),
    user: User = Depends(require_trainer),
    db: Session = Depends(get_db),
):
    if end_date is None:
        end_date = start_date + timedelta(days=60)
    range_start = datetime.combine(start_date, datetime.min.time(), tzinfo=timezone.utc)
    range_end = datetime.combine(end_date, datetime.max.time(), tzinfo=timezone.utc)
    busy = busy_bookings_for(db, user.id)
    return [
        AvailabilitySlot(start_datetime=b.start_datetime, end_datetime=b.end_datetime)
        for b in busy
        if b.end_datetime >= range_start and b.start_datetime <= range_end
    ]


# ---------- Patients (trainer manages, patients see who added them) ----------

@router.get("/me/patients", response_model=list[PatientOut])
def list_my_patients(user: User = Depends(require_trainer), db: Session = Depends(get_db)):
    links = db.query(TrainerPatient).filter(TrainerPatient.trainer_id == user.id).all()
    result = []
    for link in links:
        patient = db.get(User, link.patient_id)
        if patient:
            result.append(PatientOut(relationship_id=link.id, user=UserOut.model_validate(patient)))
    return result


@router.post("/me/patients", response_model=PatientOut, status_code=status.HTTP_201_CREATED)
def add_patient(payload: PatientAdd, user: User = Depends(require_trainer), db: Session = Depends(get_db)):
    patient = db.query(User).filter(User.phone_number == payload.phone_number.strip()).first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No user found with this phone number")
    if patient.id == user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot add yourself as a patient")
    existing = (
        db.query(TrainerPatient)
        .filter(TrainerPatient.trainer_id == user.id, TrainerPatient.patient_id == patient.id)
        .first()
    )
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Patient already in your list")
    link = TrainerPatient(trainer_id=user.id, patient_id=patient.id)
    db.add(link)
    db.commit()
    db.refresh(link)
    return PatientOut(relationship_id=link.id, user=UserOut.model_validate(patient))


@router.delete("/me/patients/{relationship_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_patient(relationship_id: uuid.UUID, user: User = Depends(require_trainer), db: Session = Depends(get_db)):
    link = db.query(TrainerPatient).filter(TrainerPatient.id == relationship_id, TrainerPatient.trainer_id == user.id).first()
    if not link:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Relationship not found")
    db.delete(link)
    db.commit()


# ---------- Reviews (trainer's own, regardless of public/private) ----------

@router.get("/me/reviews", response_model=list[TrainerReviewOut])
def list_my_reviews(user: User = Depends(require_trainer), db: Session = Depends(get_db)):
    reviews = db.query(Review).filter(Review.trainer_id == user.id).order_by(Review.created_at.desc()).all()
    result = []
    for review in reviews:
        patient = db.get(User, review.patient_id)
        out = TrainerReviewOut.model_validate(review)
        out.patient = UserOut.model_validate(patient) if patient else None
        result.append(out)
    return result
