from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import TrainerProfile, User, UserRole
from app.schemas import PasswordResetRequest, Token, UserLogin, UserOut, UserRegister
from app.security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(payload: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.phone_number == payload.phone_number).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Phone number already registered")

    user = User(
        phone_number=payload.phone_number,
        password_hash=hash_password(payload.password),
        first_name=payload.first_name,
        last_name=payload.last_name,
        birthday=payload.birthday,
        height_cm=payload.height_cm,
        weight_kg=payload.weight_kg,
        role=payload.role,
        preferred_language=payload.preferred_language,
    )
    db.add(user)
    db.flush()

    if payload.role == UserRole.TRAINER:
        db.add(TrainerProfile(user_id=user.id, required_parameters=[], payment_methods=[]))

    db.commit()
    db.refresh(user)

    token = create_access_token(str(user.id))
    return Token(access_token=token, user=UserOut.model_validate(user))


@router.post("/login", response_model=Token)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.phone_number == payload.phone_number).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid phone number or password")

    token = create_access_token(str(user.id))
    return Token(access_token=token, user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user


@router.post("/reset-password", status_code=status.HTTP_204_NO_CONTENT)
def reset_password(payload: PasswordResetRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.phone_number == payload.phone_number.strip()).first()
    mismatch = (
        user is None
        or user.last_name.strip().lower() != payload.last_name.strip().lower()
        or user.birthday != payload.birthday
    )
    if mismatch:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Details do not match our records")

    user.password_hash = hash_password(payload.new_password)
    db.commit()
