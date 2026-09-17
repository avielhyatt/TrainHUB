export type UserRole = 'trainer' | 'trainee'
export type BookingStatus = 'pending' | 'accepted' | 'declined' | 'cancelled'
export type PaymentMethod = 'cash' | 'bit' | 'paybox'

export interface User {
  id: string
  phone_number: string
  first_name: string
  last_name: string
  birthday: string
  height_cm: number | null
  weight_kg: number | null
  role: UserRole
  preferred_language: string
  photo_url: string | null
  is_verified: boolean
  has_id_document: boolean
  has_live_photo: boolean
}

export interface TrainerProfile {
  specialty: string | null
  description: string | null
  required_parameters: string[]
  cost_per_hour: number | null
  payment_methods: PaymentMethod[]
  is_public: boolean
}

export interface TrainerPublic {
  user: User
  profile: TrainerProfile | null
  avg_rating: number | null
  review_count: number
}

export interface Place {
  id: string
  name: string
  address: string | null
  details: string | null
  latitude: number | null
  longitude: number | null
}

export interface AvailabilitySlot {
  start_datetime: string
  end_datetime: string
}

export interface Slot {
  id: string
  trainer_id: string
  place_id: string | null
  start_datetime: string
  end_datetime: string
  place: Place | null
}

export interface SlotBookingSummary {
  booking_id: string
  status: BookingStatus
  patient: User | null
}

export interface SlotDetail extends Slot {
  is_available: boolean
  booking: SlotBookingSummary | null
}

export interface PatientLink {
  relationship_id: string
  user: User
}

export interface TrainerOfPatient {
  relationship_id: string
  user: User
  profile: TrainerProfile | null
}

export interface Review {
  booking_id: string
  rating: number
  comment: string | null
  created_at: string
}

export interface TrainerReview extends Review {
  patient: User | null
}

export interface Booking {
  id: string
  slot_id: string | null
  trainer_id: string
  patient_id: string
  place_id: string | null
  start_datetime: string
  end_datetime: string
  status: BookingStatus
  parameter_values: Record<string, string>
  cost: number | null
  payment_method: PaymentMethod | null
  created_at: string
  decided_at: string | null
  trainer: User | null
  patient: User | null
  place: Place | null
  review: Review | null
}

export interface PeriodStats {
  hours: number
  sessions: number
  revenue: number
}

export interface Dashboard {
  patient_count: number
  day: PeriodStats
  week: PeriodStats
  month: PeriodStats
  year: PeriodStats
  average_session_hours: number
  payment_method_breakdown: Record<string, number>
  pending_requests: number
  upcoming_sessions: number
  avg_rating: number | null
  review_count: number
}

export interface Holiday {
  id: string
  date: string
  name_he: string
  name_en: string
  name_ru: string
  is_major: boolean
}

export interface Birthday {
  user_id: string
  first_name: string
  last_name: string
  birthday: string
  next_occurrence: string
  role: UserRole
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user: User
}

export interface PublicReview {
  rating: number
  comment: string | null
  created_at: string
  patient_first_name: string
  patient_photo_url: string | null
}

export interface PublicTrainerCard {
  id: string
  first_name: string
  last_name: string
  photo_url: string | null
  is_verified: boolean
  specialty: string | null
  description: string | null
  cost_per_hour: number | null
  payment_methods: PaymentMethod[]
  avg_rating: number | null
  review_count: number
}

export interface PublicTrainerDetail extends PublicTrainerCard {
  reviews: PublicReview[]
}
