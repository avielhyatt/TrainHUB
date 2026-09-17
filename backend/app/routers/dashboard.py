from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import require_trainer
from app.models import Booking, BookingStatus, Review, TrainerPatient, User
from app.schemas import DashboardOut, PeriodStats

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


def _period_stats(bookings: list[Booking], start: datetime, end: datetime) -> PeriodStats:
    in_period = [b for b in bookings if start <= b.start_datetime < end]
    hours = sum((b.end_datetime - b.start_datetime).total_seconds() / 3600 for b in in_period)
    revenue = sum(float(b.cost) for b in in_period if b.cost)
    return PeriodStats(hours=round(hours, 2), sessions=len(in_period), revenue=round(revenue, 2))


@router.get("", response_model=DashboardOut)
def get_dashboard(user: User = Depends(require_trainer), db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    day_start, day_end = today, today + timedelta(days=1)
    week_start = today - timedelta(days=today.weekday())
    week_end = week_start + timedelta(days=7)
    month_start = today.replace(day=1)
    next_month = (month_start + timedelta(days=32)).replace(day=1)
    month_end = next_month
    year_start = today.replace(month=1, day=1)
    year_end = today.replace(year=today.year + 1, month=1, day=1)

    accepted = db.query(Booking).filter(Booking.trainer_id == user.id, Booking.status == BookingStatus.ACCEPTED).all()

    patient_count = db.query(TrainerPatient).filter(TrainerPatient.trainer_id == user.id).count()
    pending_requests = db.query(Booking).filter(Booking.trainer_id == user.id, Booking.status == BookingStatus.PENDING).count()
    upcoming_sessions = sum(1 for b in accepted if b.start_datetime >= now)

    total_sessions = len(accepted)
    total_hours = sum((b.end_datetime - b.start_datetime).total_seconds() / 3600 for b in accepted)
    average_session_hours = round(total_hours / total_sessions, 2) if total_sessions else 0.0

    payment_counts: dict[str, int] = {}
    for b in accepted:
        if b.payment_method:
            key = b.payment_method.value if hasattr(b.payment_method, "value") else str(b.payment_method)
            payment_counts[key] = payment_counts.get(key, 0) + 1
    total_payments = sum(payment_counts.values())
    payment_breakdown = {
        method: round(count / total_payments * 100, 1) for method, count in payment_counts.items()
    } if total_payments else {}

    avg_rating, review_count = (
        db.query(func.avg(Review.rating), func.count(Review.booking_id))
        .filter(Review.trainer_id == user.id)
        .one()
    )

    return DashboardOut(
        patient_count=patient_count,
        day=_period_stats(accepted, day_start, day_end),
        week=_period_stats(accepted, week_start, week_end),
        month=_period_stats(accepted, month_start, month_end),
        year=_period_stats(accepted, year_start, year_end),
        average_session_hours=average_session_hours,
        payment_method_breakdown=payment_breakdown,
        pending_requests=pending_requests,
        upcoming_sessions=upcoming_sessions,
        avg_rating=round(float(avg_rating), 2) if avg_rating is not None else None,
        review_count=review_count or 0,
    )
