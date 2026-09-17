import uuid
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, field_validator

from app.models import BookingStatus, PaymentMethod, UserRole


# ---------- Auth / Users ----------

class UserRegister(BaseModel):
    phone_number: str
    password: str
    password_confirm: str
    first_name: str
    last_name: str
    birthday: date
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    role: UserRole
    preferred_language: str = "he"

    @field_validator("phone_number")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        digits = "".join(ch for ch in v if ch.isdigit())
        if not (9 <= len(digits) <= 10):
            raise ValueError("Phone number must be 9-10 digits")
        return digits

    @field_validator("password_confirm")
    @classmethod
    def passwords_match(cls, v: str, info):
        if "password" in info.data and v != info.data["password"]:
            raise ValueError("Passwords do not match")
        return v

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


class UserLogin(BaseModel):
    phone_number: str
    password: str


class PasswordResetRequest(BaseModel):
    phone_number: str
    last_name: str
    birthday: date
    new_password: str
    new_password_confirm: str

    @field_validator("new_password_confirm")
    @classmethod
    def passwords_match(cls, v: str, info):
        if "new_password" in info.data and v != info.data["new_password"]:
            raise ValueError("Passwords do not match")
        return v

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    phone_number: str
    first_name: str
    last_name: str
    birthday: date
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    role: UserRole
    preferred_language: str
    photo_url: Optional[str] = None
    is_verified: bool = False
    has_id_document: bool = False
    has_live_photo: bool = False


class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    birthday: Optional[date] = None
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    preferred_language: Optional[str] = None


class PhotoUpdate(BaseModel):
    photo_data: str

    @field_validator("photo_data")
    @classmethod
    def valid_photo(cls, v: str) -> str:
        if not v.startswith("data:image/"):
            raise ValueError("photo_data must be a data:image/... URI")
        if len(v) > 4_000_000:
            raise ValueError("Photo is too large (max ~3MB)")
        return v


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
    new_password_confirm: str

    @field_validator("new_password_confirm")
    @classmethod
    def passwords_match(cls, v: str, info):
        if "new_password" in info.data and v != info.data["new_password"]:
            raise ValueError("Passwords do not match")
        return v

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---------- Trainer profile ----------

class TrainerProfileIn(BaseModel):
    specialty: Optional[str] = None
    description: Optional[str] = None
    required_parameters: list[str] = []
    cost_per_hour: Optional[float] = None
    payment_methods: list[PaymentMethod] = []
    is_public: bool = True


class TrainerProfileOut(TrainerProfileIn):
    model_config = ConfigDict(from_attributes=True)


class TrainerPublicOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user: UserOut
    profile: Optional[TrainerProfileOut] = None
    avg_rating: Optional[float] = None
    review_count: int = 0


# ---------- Places ----------

class PlaceIn(BaseModel):
    name: str
    address: Optional[str] = None
    details: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class PlaceOut(PlaceIn):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID


# ---------- Slots ----------

class SlotIn(BaseModel):
    start_datetime: datetime
    end_datetime: datetime
    place_id: Optional[uuid.UUID] = None


class SlotOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    trainer_id: uuid.UUID
    place_id: Optional[uuid.UUID] = None
    start_datetime: datetime
    end_datetime: datetime
    place: Optional[PlaceOut] = None


class SlotBookingSummary(BaseModel):
    booking_id: uuid.UUID
    status: BookingStatus
    patient: Optional[UserOut] = None


class SlotDetailOut(SlotOut):
    is_available: bool = True
    booking: Optional[SlotBookingSummary] = None


class AvailabilitySlot(BaseModel):
    start_datetime: datetime
    end_datetime: datetime


# ---------- Trainer-patient relationship ----------

class PatientAdd(BaseModel):
    phone_number: str


class PatientOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    relationship_id: uuid.UUID
    user: UserOut


class TrainerOfPatientOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    relationship_id: uuid.UUID
    user: UserOut
    profile: Optional[TrainerProfileOut] = None


# ---------- Bookings ----------

class BookingCreate(BaseModel):
    slot_id: uuid.UUID
    parameter_values: dict[str, str] = {}
    payment_method: Optional[PaymentMethod] = None


class BookingDecision(BaseModel):
    status: BookingStatus  # accepted | declined


class ReviewIn(BaseModel):
    rating: int
    comment: Optional[str] = None

    @field_validator("rating")
    @classmethod
    def valid_rating(cls, v: int) -> int:
        if not (0 <= v <= 10):
            raise ValueError("Rating must be between 0 and 10")
        return v


class ReviewOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    booking_id: uuid.UUID
    rating: int
    comment: Optional[str] = None
    created_at: datetime


class TrainerReviewOut(ReviewOut):
    patient: Optional[UserOut] = None


class BookingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    slot_id: Optional[uuid.UUID] = None
    trainer_id: uuid.UUID
    patient_id: uuid.UUID
    place_id: Optional[uuid.UUID] = None
    start_datetime: datetime
    end_datetime: datetime
    status: BookingStatus
    parameter_values: dict
    cost: Optional[float] = None
    payment_method: Optional[PaymentMethod] = None
    created_at: datetime
    decided_at: Optional[datetime] = None
    trainer: Optional[UserOut] = None
    patient: Optional[UserOut] = None
    place: Optional[PlaceOut] = None
    review: Optional[ReviewOut] = None


# ---------- Dashboard ----------

class PeriodStats(BaseModel):
    hours: float
    sessions: int
    revenue: float


class DashboardOut(BaseModel):
    patient_count: int
    day: PeriodStats
    week: PeriodStats
    month: PeriodStats
    year: PeriodStats
    average_session_hours: float
    payment_method_breakdown: dict[str, float]
    pending_requests: int
    upcoming_sessions: int
    avg_rating: Optional[float] = None
    review_count: int = 0


# ---------- Holidays / Birthdays ----------

class HolidayOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    date: date
    name_he: str
    name_en: str
    name_ru: str
    is_major: bool


class BirthdayOut(BaseModel):
    user_id: uuid.UUID
    first_name: str
    last_name: str
    birthday: date
    next_occurrence: date
    role: UserRole


# ---------- Public trainer directory ----------

class PublicReviewOut(BaseModel):
    rating: int
    comment: Optional[str] = None
    created_at: datetime
    patient_first_name: str
    patient_photo_url: Optional[str] = None


class PublicTrainerCard(BaseModel):
    id: uuid.UUID
    first_name: str
    last_name: str
    photo_url: Optional[str] = None
    is_verified: bool = False
    specialty: Optional[str] = None
    description: Optional[str] = None
    cost_per_hour: Optional[float] = None
    payment_methods: list[PaymentMethod] = []
    avg_rating: Optional[float] = None
    review_count: int = 0


class PublicTrainerDetail(PublicTrainerCard):
    reviews: list[PublicReviewOut] = []
