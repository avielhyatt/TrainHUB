import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../../api/client'
import type { Birthday, Dashboard, Holiday } from '../../api/types'
import Card from '../../components/ui/Card'
import PageHeader from '../../components/ui/PageHeader'
import Spinner from '../../components/ui/Spinner'
import StatTile from '../../components/ui/StatTile'
import PaymentBreakdownChart from '../../components/PaymentBreakdownChart'

const PERIODS: { key: 'day' | 'week' | 'month' | 'year'; labelKey: string }[] = [
  { key: 'day', labelKey: 'dashboard.today' },
  { key: 'week', labelKey: 'dashboard.this_week' },
  { key: 'month', labelKey: 'dashboard.this_month' },
  { key: 'year', labelKey: 'dashboard.this_year' },
]

export default function TrainerDashboard() {
  const { t, i18n } = useTranslation()
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [birthdays, setBirthdays] = useState<Birthday[] | null>(null)
  const [holidays, setHolidays] = useState<Holiday[] | null>(null)

  useEffect(() => {
    api.get<Dashboard>('/dashboard').then(({ data }) => setDashboard(data))
    api.get<Birthday[]>('/birthdays/upcoming').then(({ data }) => setBirthdays(data))
    api.get<Holiday[]>('/holidays').then(({ data }) => setHolidays(data))
  }, [])

  if (!dashboard) return <Spinner />

  const holidayNameKey = `name_${i18n.language === 'he' || i18n.language === 'en' || i18n.language === 'ru' ? i18n.language : 'en'}` as
    | 'name_he'
    | 'name_en'
    | 'name_ru'

  return (
    <div>
      <PageHeader title={t('dashboard.title')} />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile icon="🧑‍🤝‍🧑" label={t('dashboard.patients_count')} value={dashboard.patient_count} />
        <StatTile icon="📥" label={t('dashboard.pending_requests')} value={dashboard.pending_requests} />
        <StatTile icon="📅" label={t('dashboard.upcoming_sessions')} value={dashboard.upcoming_sessions} />
        <StatTile
          icon="⏱️"
          label={t('dashboard.average_session')}
          value={`${dashboard.average_session_hours} ${t('dashboard.hours')}`}
        />
        <StatTile
          icon="⭐"
          label={t('dashboard.avg_rating')}
          value={dashboard.avg_rating != null ? `${dashboard.avg_rating}/10 (${dashboard.review_count})` : '—'}
        />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PERIODS.map(({ key, labelKey }) => {
          const stats = dashboard[key]
          return (
            <Card key={key}>
              <h3 className="mb-3 text-sm font-semibold text-ink-500">{t(labelKey)}</h3>
              <dl className="flex flex-col gap-1.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-ink-400">{t('dashboard.sessions')}</dt>
                  <dd className="tabular-nums font-medium text-ink-800">{stats.sessions}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-400">{t('dashboard.hours')}</dt>
                  <dd className="tabular-nums font-medium text-ink-800">{stats.hours}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-400">{t('dashboard.revenue')}</dt>
                  <dd className="tabular-nums font-semibold text-brand-700">
                    {stats.revenue} {t('dashboard.currency')}
                  </dd>
                </div>
              </dl>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <h3 className="mb-4 font-semibold text-ink-800">{t('dashboard.payment_breakdown')}</h3>
          <PaymentBreakdownChart data={dashboard.payment_method_breakdown} />
        </Card>

        <Card className="lg:col-span-1">
          <h3 className="mb-4 font-semibold text-ink-800">🎂 {t('dashboard.upcoming_birthdays')}</h3>
          {!birthdays ? (
            <Spinner />
          ) : birthdays.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-400">{t('dashboard.no_birthdays')}</p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {birthdays.slice(0, 8).map((b) => (
                <li key={b.user_id} className="flex items-center justify-between text-sm">
                  <span className="text-ink-700">
                    {b.first_name} {b.last_name}
                  </span>
                  <span className="tabular-nums text-ink-400">
                    {new Date(b.next_occurrence).toLocaleDateString(i18n.language, { day: '2-digit', month: '2-digit' })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="lg:col-span-1">
          <h3 className="mb-4 font-semibold text-ink-800">🎉 {t('dashboard.upcoming_holidays')}</h3>
          {!holidays ? (
            <Spinner />
          ) : holidays.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-400">{t('dashboard.no_holidays')}</p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {holidays.slice(0, 8).map((h) => (
                <li key={h.id} className="flex items-center justify-between text-sm">
                  <span className="text-ink-700">{h[holidayNameKey]}</span>
                  <span className="tabular-nums text-ink-400">
                    {new Date(h.date).toLocaleDateString(i18n.language, { day: '2-digit', month: '2-digit' })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}
