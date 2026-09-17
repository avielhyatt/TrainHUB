import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { api, apiErrorMessage } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import type { AvailabilitySlot, Slot, TrainerPublic } from '../../api/types'
import Card from '../../components/ui/Card'
import PageHeader from '../../components/ui/PageHeader'
import Spinner from '../../components/ui/Spinner'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Avatar from '../../components/ui/Avatar'
import { Input, Select } from '../../components/ui/Field'
import { overlapsAny } from '../../utils/schedule'
import WeekCalendar, { type CalendarEvent } from '../../components/WeekCalendar'
import PlaceMapView from '../../components/PlaceMapView'

function formatDateTime(iso: string, locale: string) {
  return new Date(iso).toLocaleString(locale, {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function slotCost(slot: Slot, costPerHour: number): number {
  const hours = (new Date(slot.end_datetime).getTime() - new Date(slot.start_datetime).getTime()) / 3600000
  return Math.round(costPerHour * hours * 100) / 100
}

export default function TraineeBookTrainer() {
  const { t, i18n } = useTranslation()
  const { trainerId } = useParams<{ trainerId: string }>()
  const { user } = useAuth()
  const isViewerTrainer = user?.role === 'trainer'

  const [trainer, setTrainer] = useState<TrainerPublic | null>(null)
  const [slots, setSlots] = useState<Slot[] | null>(null)
  const [ownBusy, setOwnBusy] = useState<AvailabilitySlot[]>([])

  const [weekOf, setWeekOf] = useState(new Date())
  const [modalSlot, setModalSlot] = useState<Slot | null>(null)
  const [paymentMethod, setPaymentMethod] = useState('')
  const [paramValues, setParamValues] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [saving, setSaving] = useState(false)

  function loadAll() {
    if (!trainerId) return
    api.get<TrainerPublic>(`/trainers/${trainerId}`).then(({ data }) => setTrainer(data))
    api.get<Slot[]>(`/trainers/${trainerId}/slots`).then(({ data }) => setSlots(data))
    if (isViewerTrainer) {
      api.get<AvailabilitySlot[]>('/trainers/me/busy-times').then(({ data }) => setOwnBusy(data))
    }
  }

  useEffect(loadAll, [trainerId])

  const events: CalendarEvent[] = useMemo(() => {
    if (!slots) return []
    return slots.map((slot) => {
      const busy = isViewerTrainer && overlapsAny(new Date(slot.start_datetime), new Date(slot.end_datetime), ownBusy)
      return {
        id: slot.id,
        start: new Date(slot.start_datetime),
        end: new Date(slot.end_datetime),
        label: new Date(slot.start_datetime).toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' }),
        sublabel: busy ? t('trainee.you_are_busy') : slot.place?.name,
        color: busy ? 'busy' : 'available',
        onClick: busy ? undefined : () => openModal(slot),
      } as CalendarEvent
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slots, ownBusy, isViewerTrainer, i18n.language])

  function openModal(slot: Slot) {
    setModalSlot(slot)
    setPaymentMethod(trainer?.profile?.payment_methods[0] || '')
    setParamValues({})
    setError('')
    setSuccess(false)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!modalSlot) return
    setError('')
    setSaving(true)
    try {
      await api.post('/bookings', {
        slot_id: modalSlot.id,
        parameter_values: paramValues,
        payment_method: paymentMethod || null,
      })
      setSuccess(true)
      loadAll()
    } catch (err) {
      setError(apiErrorMessage(err, t('common.error')))
    } finally {
      setSaving(false)
    }
  }

  if (!trainer || !slots) return <Spinner />

  const requiredParams = trainer.profile?.required_parameters || []
  const paymentMethods = trainer.profile?.payment_methods || []

  return (
    <div>
      <Link to="/trainee/trainers" className="mb-4 inline-block text-sm text-ink-500 hover:text-brand-700">
        ← {t('common.back')}
      </Link>

      <Card className="mb-6 flex flex-wrap items-start gap-4">
        <Avatar
          photoUrl={trainer.user.photo_url}
          verified={trainer.user.is_verified}
          firstName={trainer.user.first_name}
          lastName={trainer.user.last_name}
          size="xl"
        />
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold text-ink-900">
            {trainer.user.first_name} {trainer.user.last_name}
          </h1>
          {trainer.profile?.specialty && <p className="font-medium text-brand-600">{trainer.profile.specialty}</p>}
          {trainer.profile?.description && <p className="mt-2 text-sm text-ink-600">{trainer.profile.description}</p>}
          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
            {trainer.avg_rating != null ? (
              <span className="font-semibold text-amber-600">
                ⭐ {trainer.avg_rating}/10 · {trainer.review_count} {t('publicTrainers.reviews')}
              </span>
            ) : (
              <span className="text-ink-400">{t('publicTrainers.no_reviews_yet')}</span>
            )}
            {trainer.profile?.cost_per_hour != null && (
              <span className="font-semibold text-ink-800">
                {t('trainee.cost_per_hour')}: {trainer.profile.cost_per_hour} {t('dashboard.currency')}/{t('trainee.hour_abbr')}
              </span>
            )}
          </div>
        </div>
      </Card>

      <PageHeader title={t('trainee.pick_time')} />
      {isViewerTrainer && <p className="-mt-4 mb-4 text-sm text-ink-500">{t('trainee.dual_calendar_hint')}</p>}

      {events.length === 0 ? (
        <p className="text-sm text-ink-400">{t('schedule.no_slots_available')}</p>
      ) : (
        <WeekCalendar weekOf={weekOf} onWeekChange={setWeekOf} events={events} />
      )}

      <Modal open={!!modalSlot} onClose={() => setModalSlot(null)} title={t('trainee.book_training')}>
        {success ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <span className="text-4xl">✅</span>
            <p className="text-sm text-ink-600">{t('trainee.request_sent')}</p>
            <Button onClick={() => setModalSlot(null)}>{t('common.close')}</Button>
          </div>
        ) : (
          modalSlot && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <p className="text-sm text-ink-600">
                {formatDateTime(modalSlot.start_datetime, i18n.language)} — {formatDateTime(modalSlot.end_datetime, i18n.language)}
                {modalSlot.place?.name && (
                  <span className="block text-ink-400">
                    📍 {modalSlot.place.name}
                    {modalSlot.place.details && ` · ${modalSlot.place.details}`}
                  </span>
                )}
              </p>
              {modalSlot.place && (
                <PlaceMapView
                  latitude={modalSlot.place.latitude}
                  longitude={modalSlot.place.longitude}
                  address={modalSlot.place.address}
                  name={modalSlot.place.name}
                />
              )}

              {trainer.profile?.cost_per_hour != null && (
                <p className="rounded-xl bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-700">
                  {t('trainee.session_cost')}: {slotCost(modalSlot, trainer.profile.cost_per_hour)} {t('dashboard.currency')}
                </p>
              )}

              {paymentMethods.length > 0 && (
                <Select
                  label={t('trainee.select_payment')}
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="">—</option>
                  {paymentMethods.map((m) => (
                    <option key={m} value={m}>
                      {t(`profile.payment_${m}`)}
                    </option>
                  ))}
                </Select>
              )}

              {requiredParams.length > 0 && (
                <div className="flex flex-col gap-3">
                  <span className="text-sm font-medium text-ink-700">{t('trainee.fill_parameters')}</span>
                  {requiredParams.map((p) => (
                    <Input
                      key={p}
                      label={p}
                      required
                      value={paramValues[p] || ''}
                      onChange={(e) => setParamValues((prev) => ({ ...prev, [p]: e.target.value }))}
                    />
                  ))}
                </div>
              )}

              {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

              <Button type="submit" loading={saving}>
                {t('trainee.send_request')}
              </Button>
            </form>
          )
        )}
      </Modal>
    </div>
  )
}
