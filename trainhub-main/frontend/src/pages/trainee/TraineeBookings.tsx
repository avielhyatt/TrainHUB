import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { api, apiErrorMessage } from '../../api/client'
import type { Booking } from '../../api/types'
import Card from '../../components/ui/Card'
import PageHeader from '../../components/ui/PageHeader'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import Button from '../../components/ui/Button'
import StatusBadge from '../../components/ui/StatusBadge'
import Modal from '../../components/ui/Modal'
import { Textarea } from '../../components/ui/Field'
import { RatingBadge, RatingPicker } from '../../components/ui/RatingStars'
import Avatar from '../../components/ui/Avatar'
import PlaceMapModal from '../../components/PlaceMapModal'
import type { Place } from '../../api/types'

function formatDateTime(iso: string, locale: string) {
  return new Date(iso).toLocaleString(locale, {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function TraineeBookings() {
  const { t, i18n } = useTranslation()
  const [bookings, setBookings] = useState<Booking[] | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [reviewTarget, setReviewTarget] = useState<Booking | null>(null)
  const [rating, setRating] = useState<number | null>(null)
  const [comment, setComment] = useState('')
  const [reviewError, setReviewError] = useState('')
  const [reviewSaving, setReviewSaving] = useState(false)
  const [mapPlace, setMapPlace] = useState<Place | null>(null)

  function load() {
    api.get<Booking[]>('/bookings/mine').then(({ data }) => setBookings(data))
  }

  useEffect(load, [])

  async function cancel(id: string) {
    if (!window.confirm(t('bookings.confirm_cancel'))) return
    setBusyId(id)
    try {
      await api.post(`/bookings/${id}/cancel`)
      load()
    } finally {
      setBusyId(null)
    }
  }

  function openReview(booking: Booking) {
    setReviewTarget(booking)
    setRating(null)
    setComment('')
    setReviewError('')
  }

  async function submitReview(e: FormEvent) {
    e.preventDefault()
    if (!reviewTarget || rating === null) return
    setReviewSaving(true)
    setReviewError('')
    try {
      await api.post(`/bookings/${reviewTarget.id}/review`, { rating, comment: comment || null })
      setReviewTarget(null)
      load()
    } catch (err) {
      setReviewError(apiErrorMessage(err, t('common.error')))
    } finally {
      setReviewSaving(false)
    }
  }

  const now = Date.now()

  return (
    <div>
      <PageHeader title={t('bookings.title')} />

      {bookings === null ? (
        <Spinner />
      ) : bookings.length === 0 ? (
        <EmptyState icon="🗓️" text={t('bookings.no_bookings')} />
      ) : (
        <div className="flex flex-col gap-4">
          {bookings.map((b) => {
            const canReview = b.status === 'accepted' && new Date(b.end_datetime).getTime() < now && !b.review
            return (
              <Card key={b.id} className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar
                    photoUrl={b.trainer?.photo_url}
                    firstName={b.trainer?.first_name}
                    lastName={b.trainer?.last_name}
                    verified={b.trainer?.is_verified}
                  />
                  <div>
                    <h3 className="font-semibold text-ink-800">
                      {t('bookings.with_trainer')} {b.trainer?.first_name} {b.trainer?.last_name}
                    </h3>
                    <p className="mt-1 text-sm text-ink-500">
                      {formatDateTime(b.start_datetime, i18n.language)} — {formatDateTime(b.end_datetime, i18n.language)}
                    </p>
                    {b.place?.name && (
                      <button
                        onClick={() => setMapPlace(b.place)}
                        className="mt-0.5 cursor-pointer text-sm text-brand-600 hover:underline"
                      >
                        📍 {b.place.name}
                      </button>
                    )}
                    {b.review && (
                      <div className="mt-2 flex items-start gap-2">
                        <RatingBadge rating={b.review.rating} />
                        {b.review.comment && <p className="text-sm text-ink-500">{b.review.comment}</p>}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={b.status} />
                  {canReview && (
                    <Button size="sm" onClick={() => openReview(b)}>
                      {t('bookings.rate_session')}
                    </Button>
                  )}
                  {(b.status === 'pending' || b.status === 'accepted') && (
                    <Button variant="danger" size="sm" loading={busyId === b.id} onClick={() => cancel(b.id)}>
                      {t('bookings.cancel_booking')}
                    </Button>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Modal open={!!reviewTarget} onClose={() => setReviewTarget(null)} title={t('bookings.rate_session')}>
        <form onSubmit={submitReview} className="flex flex-col gap-4">
          <div>
            <span className="mb-2 block text-sm font-medium text-ink-700">{t('bookings.rating_label')}</span>
            <RatingPicker value={rating} onChange={setRating} />
          </div>
          <Textarea
            label={t('bookings.comment_label')}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          {reviewError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{reviewError}</p>}
          <Button type="submit" loading={reviewSaving} disabled={rating === null}>
            {t('bookings.submit_rating')}
          </Button>
        </form>
      </Modal>

      <PlaceMapModal place={mapPlace} onClose={() => setMapPlace(null)} />
    </div>
  )
}
