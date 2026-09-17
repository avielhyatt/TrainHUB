from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import User
from app.schemas import ChangePasswordRequest, PhotoUpdate, UserOut, UserUpdate
from app.security import hash_password, verify_password
from app.storage import delete_image, s3_enabled, upload_image

router = APIRouter(prefix="/users", tags=["users"])


@router.put("/me", response_model=UserOut)
def update_me(payload: UserUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    data = payload.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user


@router.post("/me/change-password", status_code=status.HTTP_204_NO_CONTENT)
def change_password(payload: ChangePasswordRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not verify_password(payload.current_password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")

    user.password_hash = hash_password(payload.new_password)
    db.commit()


def _store_verification_image(data_uri: str, prefix: str) -> str:
    """S3 key when S3 is configured; otherwise the raw data URI is kept as a
    presence marker only (these images are never re-displayed, just checked
    for existence to compute is_verified)."""
    if s3_enabled():
        return upload_image(data_uri, prefix)
    return data_uri


@router.put("/me/photo", response_model=UserOut)
def update_photo(payload: PhotoUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if s3_enabled():
        if user.photo_key:
            delete_image(user.photo_key)
        user.photo_key = upload_image(payload.photo_data, f"users/{user.id}/photo")
        user.photo_data = None
    else:
        user.photo_key = None
        user.photo_data = payload.photo_data
    db.commit()
    db.refresh(user)
    return user


@router.delete("/me/photo", response_model=UserOut)
def delete_photo(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.photo_key:
        delete_image(user.photo_key)
    user.photo_key = None
    user.photo_data = None
    db.commit()
    db.refresh(user)
    return user


@router.put("/me/id-document", response_model=UserOut)
def update_id_document(payload: PhotoUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if s3_enabled() and user.id_document_key:
        delete_image(user.id_document_key)
    user.id_document_key = _store_verification_image(payload.photo_data, f"users/{user.id}/id-document")
    db.commit()
    db.refresh(user)
    return user


@router.put("/me/live-photo", response_model=UserOut)
def update_live_photo(payload: PhotoUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if s3_enabled() and user.live_photo_key:
        delete_image(user.live_photo_key)
    user.live_photo_key = _store_verification_image(payload.photo_data, f"users/{user.id}/live-photo")
    db.commit()
    db.refresh(user)
    return user
