import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../../api/client'
import type { Booking, BookingStatus } from '../../api/types'
import Card from '../../components/ui/Card'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import StatusBadge from '../../components/ui/StatusBadge'
import Avatar from '../../components/ui/Avatar'
import PlaceMapModal from '../../components/PlaceMapModal'
import type { Place } from '../../api/types'

const TABS: BookingStatus[] = ['pending', 'accepted', 'declined', 'cancelled']

function formatDateTime(iso: string, locale: string) {
  return new Date(iso).toLocaleString(locale, {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function TrainerRequests() {
  const { t, i18n } = useTranslation()
  const [tab, setTab] = useState<BookingStatus>('pending')
  const [bookings, setBookings] = useState<Booking[] | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [mapPlace, setMapPlace] = useState<Place | null>(null)

  function load(status: BookingStatus) {
    setBookings(null)
    api.get<Booking[]>('/bookings', { params: { status } }).then(({ data }) => setBookings(data))
  }

  useEffect(() => load(tab), [tab])

  async function decide(id: string, status: 'accepted' | 'declined') {
    setBusyId(id)
    try {
      await api.put(`/bookings/${id}/decision`, { status })
      load(tab)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <PageHeader title={t('requests.title')} />

      <div className="mb-5 flex gap-2 overflow-x-auto">
        {TABS.map((status) => (
          <button
            key={status}
            onClick={() => setTab(status)}
            className={`shrink-0 cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              tab === status ? 'bg-brand-600 text-white' : 'bg-white text-ink-500 border border-ink-200 hover:bg-ink-50'
            }`}
          >
            {t(`requests.${status}`)}
          </button>
        ))}
      </div>

      {bookings === null ? (
        <Spinner />
      ) : bookings.length === 0 ? (
        <EmptyState icon="📥" text={t('requests.no_requests')} />
      ) : (
        <div className="flex flex-col gap-4">
          {bookings.map((b) => (
            <Card key={b.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar
                    photoUrl={b.patient?.photo_url}
                    firstName={b.patient?.first_name}
                    lastName={b.patient?.last_name}
                    verified={b.patient?.is_verified}
                  />
                  <div>
                    <h3 className="font-semibold text-ink-800">
                      {t('requests.requested_by')}: {b.patient?.first_name} {b.patient?.last_name}
                    </h3>
                    <p className="mt-1 text-sm text-ink-500">{formatDateTime(b.start_datetime, i18n.language)} — {formatDateTime(b.end_datetime, i18n.language)}</p>
                  </div>
                </div>
                <StatusBadge status={b.status} />
              </div>

              <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1 text-sm text-ink-600 sm:grid-cols-2">
                <p>
                  <span className="text-ink-400">{t('requests.place')}: </span>
                  {b.place ? (
                    <button onClick={() => setMapPlace(b.place)} className="cursor-pointer text-brand-600 hover:underline">
                      {b.place.name}
                    </button>
                  ) : (
                    t('requests.no_place')
                  )}
                </p>
                {b.payment_method && (
                  <p>
                    <span className="text-ink-400">{t('requests.payment_method')}: </span>
                    {t(`profile.payment_${b.payment_method}`)}
                  </p>
                )}
                {b.cost != null && (
                  <p>
                    <span className="text-ink-400">{t('requests.total_cost')}: </span>
                    {b.cost} {t('dashboard.currency')}
                  </p>
                )}
              </div>

              {Object.keys(b.parameter_values).length > 0 && (
                <div className="mt-3 rounded-xl bg-ink-50 p-3 text-sm">
                  <p className="mb-1 font-medium text-ink-600">{t('requests.parameters')}</p>
                  <ul className="flex flex-col gap-0.5 text-ink-500">
                    {Object.entries(b.parameter_values).map(([k, v]) => (
                      <li key={k}>
                        <span className="font-medium text-ink-700">{k}:</span> {v}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {b.status === 'pending' && (
                <div className="mt-4 flex gap-2">
                  <Button size="sm" loading={busyId === b.id} onClick={() => decide(b.id, 'accepted')}>
                    {t('requests.accept')}
                  </Button>
                  <Button size="sm" variant="danger" loading={busyId === b.id} onClick={() => decide(b.id, 'declined')}>
                    {t('requests.decline')}
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <PlaceMapModal place={mapPlace} onClose={() => setMapPlace(null)} />
    </div>
  )
}
