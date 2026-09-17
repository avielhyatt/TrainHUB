import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { api, apiErrorMessage } from '../../api/client'
import type { Place, SlotDetail } from '../../api/types'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import Modal from '../../components/ui/Modal'
import Avatar from '../../components/ui/Avatar'
import { Input, Select } from '../../components/ui/Field'
import WeekCalendar, { type CalendarEvent } from '../../components/WeekCalendar'
import PlaceMapView from '../../components/PlaceMapView'

function toLocalInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function formatDateTime(iso: string, locale: string) {
  return new Date(iso).toLocaleString(locale, {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function TrainerSchedule() {
  const { t, i18n } = useTranslation()
  const [slots, setSlots] = useState<SlotDetail[] | null>(null)
  const [places, setPlaces] = useState<Place[]>([])
  const [weekOf, setWeekOf] = useState(new Date())

  const [addModalOpen, setAddModalOpen] = useState(false)
  const [startDateTime, setStartDateTime] = useState('')
  const [endDateTime, setEndDateTime] = useState('')
  const [placeId, setPlaceId] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const [detailSlot, setDetailSlot] = useState<SlotDetail | null>(null)

  function loadSlots() {
    const startDate = new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10)
    const endDate = new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10)
    api
      .get<SlotDetail[]>('/trainers/me/slots', { params: { start_date: startDate, end_date: endDate } })
      .then(({ data }) => setSlots(data))
  }

  useEffect(() => {
    loadSlots()
    api.get<Place[]>('/trainers/me/places').then(({ data }) => setPlaces(data))
  }, [])

  function openAddModal(prefill?: Date) {
    const start = prefill || new Date()
    const end = new Date(start.getTime() + 60 * 60000)
    setStartDateTime(toLocalInputValue(start))
    setEndDateTime(toLocalInputValue(end))
    setPlaceId('')
    setError('')
    setAddModalOpen(true)
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await api.post('/trainers/me/slots', {
        start_datetime: new Date(startDateTime).toISOString(),
        end_datetime: new Date(endDateTime).toISOString(),
        place_id: placeId || null,
      })
      setAddModalOpen(false)
      loadSlots()
    } catch (err) {
      setError(apiErrorMessage(err, t('common.error')))
    } finally {
      setSaving(false)
    }
  }

  async function deleteSlot(id: string) {
    setSlots((prev) => prev?.filter((s) => s.id !== id) ?? null)
    setDetailSlot(null)
    await api.delete(`/trainers/me/slots/${id}`)
  }

  const events: CalendarEvent[] = (slots || []).map((slot) => ({
    id: slot.id,
    start: new Date(slot.start_datetime),
    end: new Date(slot.end_datetime),
    label: `${new Date(slot.start_datetime).toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' })}`,
    sublabel: slot.is_available
      ? t('schedule.available')
      : slot.booking?.patient
        ? `${slot.booking.patient.first_name} ${slot.booking.patient.last_name}`
        : undefined,
    color: slot.is_available ? 'available' : slot.booking?.status === 'accepted' ? 'accepted' : 'pending',
    onClick: () => setDetailSlot(slot),
  }))

  return (
    <div>
      <PageHeader
        title={t('schedule.title')}
        action={<Button onClick={() => openAddModal()}>+ {t('schedule.add_slot')}</Button>}
      />

      {slots === null ? (
        <Spinner />
      ) : (
        <WeekCalendar weekOf={weekOf} onWeekChange={setWeekOf} events={events} onCellClick={openAddModal} />
      )}

      <Modal open={addModalOpen} onClose={() => setAddModalOpen(false)} title={t('schedule.add_slot')}>
        <form onSubmit={handleAdd} className="flex flex-col gap-4">
          <Input
            label={t('schedule.start_time')}
            type="datetime-local"
            required
            value={startDateTime}
            onChange={(e) => setStartDateTime(e.target.value)}
          />
          <Input
            label={t('schedule.end_time')}
            type="datetime-local"
            required
            value={endDateTime}
            onChange={(e) => setEndDateTime(e.target.value)}
          />
          {places.length > 0 && (
            <Select label={t('trainee.select_place')} value={placeId} onChange={(e) => setPlaceId(e.target.value)}>
              <option value="">—</option>
              {places.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          )}
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          <Button type="submit" loading={saving}>
            {t('common.add')}
          </Button>
        </form>
      </Modal>

      <Modal open={!!detailSlot} onClose={() => setDetailSlot(null)} title={t('schedule.slot_details')}>
        {detailSlot && (
          <div className="flex flex-col gap-4">
            <p className="text-sm font-medium text-ink-700">
              {formatDateTime(detailSlot.start_datetime, i18n.language)} —{' '}
              {formatDateTime(detailSlot.end_datetime, i18n.language)}
            </p>
            {detailSlot.place && (
              <div>
                <p className="mb-1.5 text-sm text-ink-500">
                  📍 {detailSlot.place.name}
                  {detailSlot.place.details && ` · ${detailSlot.place.details}`}
                </p>
                <PlaceMapView
                  latitude={detailSlot.place.latitude}
                  longitude={detailSlot.place.longitude}
                  address={detailSlot.place.address}
                  name={detailSlot.place.name}
                />
              </div>
            )}
            {detailSlot.booking?.patient ? (
              <div className="flex items-center gap-3 rounded-xl bg-ink-50 p-3">
                <Avatar
                  photoUrl={detailSlot.booking.patient.photo_url}
                  firstName={detailSlot.booking.patient.first_name}
                  lastName={detailSlot.booking.patient.last_name}
                  verified={detailSlot.booking.patient.is_verified}
                />
                <div>
                  <p className="text-sm font-medium text-ink-800">
                    {detailSlot.booking.patient.first_name} {detailSlot.booking.patient.last_name}
                  </p>
                  <p className="text-xs text-ink-400">{t(`bookings.status_${detailSlot.booking.status}`)}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-brand-600">{t('schedule.available')}</p>
            )}
            {detailSlot.is_available && (
              <Button variant="danger" onClick={() => deleteSlot(detailSlot.id)}>
                {t('common.delete')}
              </Button>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
