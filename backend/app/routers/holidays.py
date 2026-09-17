from datetime import date, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import Holiday, TrainerPatient, User, UserRole
from app.schemas import BirthdayOut, HolidayOut

router = APIRouter(tags=["holidays"])


@router.get("/holidays", response_model=list[HolidayOut])
def list_holidays(
    days: int = Query(default=90, ge=1, le=730),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    today = date.today()
    end = today + timedelta(days=days)
    holidays = db.query(Holiday).filter(Holiday.date >= today, Holiday.date <= end).order_by(Holiday.date).all()
    return holidays


def _next_occurrence(birthday: date, today: date) -> date:
    try:
        candidate = birthday.replace(year=today.year)
    except ValueError:  # Feb 29
        candidate = birthday.replace(year=today.year, day=28)
    if candidate < today:
        try:
            candidate = birthday.replace(year=today.year + 1)
        except ValueError:
            candidate = birthday.replace(year=today.year + 1, day=28)
    return candidate


@router.get("/birthdays/upcoming", response_model=list[BirthdayOut])
def upcoming_birthdays(
    days: int = Query(default=60, ge=1, le=365),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    today = date.today()
    if user.role == UserRole.TRAINER:
        links = db.query(TrainerPatient).filter(TrainerPatient.trainer_id == user.id).all()
        people = [db.get(User, link.patient_id) for link in links]
    else:
        links = db.query(TrainerPatient).filter(TrainerPatient.patient_id == user.id).all()
        people = [db.get(User, link.trainer_id) for link in links]

    result = []
    for person in people:
        if not person:
            continue
        next_occ = _next_occurrence(person.birthday, today)
        if (next_occ - today).days <= days:
            result.append(
                BirthdayOut(
                    user_id=person.id,
                    first_name=person.first_name,
                    last_name=person.last_name,
                    birthday=person.birthday,
                    next_occurrence=next_occ,
                    role=person.role,
                )
            )
    result.sort(key=lambda b: b.next_occurrence)
    return result
