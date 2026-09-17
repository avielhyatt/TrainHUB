import { useTranslation } from 'react-i18next'
import type { PaymentMethod } from '../api/types'

const ORDER: { key: PaymentMethod; color: string }[] = [
  { key: 'cash', color: '#2a78d6' },
  { key: 'bit', color: '#eb6834' },
  { key: 'paybox', color: '#1baf7a' },
]

export default function PaymentBreakdownChart({ data }: { data: Record<string, number> }) {
  const { t } = useTranslation()
  const hasData = Object.keys(data).length > 0

  if (!hasData) {
    return <p className="py-6 text-center text-sm text-ink-400">{t('dashboard.no_payments_yet')}</p>
  }

  return (
    <div className="flex flex-col gap-3">
      {ORDER.map(({ key, color }) => {
        const pct = data[key] ?? 0
        return (
          <div key={key} className="flex items-center gap-3">
            <span className="w-16 shrink-0 text-sm text-ink-600">{t(`profile.payment_${key}`)}</span>
            <div
              className="h-3 flex-1 overflow-hidden rounded-full bg-ink-100"
              title={`${t(`profile.payment_${key}`)}: ${pct}%`}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: color }}
              />
            </div>
            <span className="w-12 shrink-0 text-end text-sm font-medium tabular-nums text-ink-700">{pct}%</span>
          </div>
        )
      })}
    </div>
  )
}
