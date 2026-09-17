from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import TrainerPatient, TrainerProfile, User
from app.schemas import TrainerOfPatientOut, UserOut

router = APIRouter(prefix="/patients", tags=["patients"])


@router.get("/me/trainers", response_model=list[TrainerOfPatientOut])
def list_my_trainers(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    links = db.query(TrainerPatient).filter(TrainerPatient.patient_id == user.id).all()
    result = []
    for link in links:
        trainer = db.get(User, link.trainer_id)
        if not trainer:
            continue
        profile = db.get(TrainerProfile, trainer.id)
        result.append(
            TrainerOfPatientOut(relationship_id=link.id, user=UserOut.model_validate(trainer), profile=profile)
        )
    return result
