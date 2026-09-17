import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Review, TrainerProfile, User, UserRole
from app.schemas import PublicReviewOut, PublicTrainerCard, PublicTrainerDetail

router = APIRouter(prefix="/public", tags=["public"])


def _rating_stats(db: Session, trainer_id: uuid.UUID) -> tuple[float | None, int]:
    avg_rating, review_count = (
        db.query(func.avg(Review.rating), func.count(Review.booking_id))
        .filter(Review.trainer_id == trainer_id)
        .one()
    )
    return (round(float(avg_rating), 2) if avg_rating is not None else None, review_count or 0)


@router.get("/trainers", response_model=list[PublicTrainerCard])
def list_public_trainers(db: Session = Depends(get_db)):
    rows = (
        db.query(User, TrainerProfile)
        .join(TrainerProfile, TrainerProfile.user_id == User.id)
        .filter(User.role == UserRole.TRAINER, TrainerProfile.is_public.is_(True))
        .all()
    )
    cards = []
    for user, profile in rows:
        avg_rating, review_count = _rating_stats(db, user.id)
        cards.append(
            PublicTrainerCard(
                id=user.id,
                first_name=user.first_name,
                last_name=user.last_name,
                photo_url=user.photo_url,
                is_verified=user.is_verified,
                specialty=profile.specialty,
                description=profile.description,
                cost_per_hour=profile.cost_per_hour,
                payment_methods=profile.payment_methods,
                avg_rating=avg_rating,
                review_count=review_count,
            )
        )
    cards.sort(key=lambda c: (c.avg_rating is None, -(c.avg_rating or 0), -c.review_count))
    return cards


@router.get("/trainers/{trainer_id}", response_model=PublicTrainerDetail)
def get_public_trainer(trainer_id: uuid.UUID, db: Session = Depends(get_db)):
    user = db.get(User, trainer_id)
    profile = db.get(TrainerProfile, trainer_id)
    if not user or user.role != UserRole.TRAINER or not profile or not profile.is_public:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trainer not found")

    avg_rating, review_count = _rating_stats(db, trainer_id)
    reviews = db.query(Review).filter(Review.trainer_id == trainer_id).order_by(Review.created_at.desc()).all()
    review_list = []
    for r in reviews:
        patient = db.get(User, r.patient_id)
        review_list.append(
            PublicReviewOut(
                rating=r.rating,
                comment=r.comment,
                created_at=r.created_at,
                patient_first_name=patient.first_name if patient else "—",
                patient_photo_url=patient.photo_url if patient else None,
            )
        )

    return PublicTrainerDetail(
        id=user.id,
        first_name=user.first_name,
        last_name=user.last_name,
        photo_url=user.photo_url,
        is_verified=user.is_verified,
        specialty=profile.specialty,
        description=profile.description,
        cost_per_hour=profile.cost_per_hour,
        payment_methods=profile.payment_methods,
        avg_rating=avg_rating,
        review_count=review_count,
        reviews=review_list,
    )
