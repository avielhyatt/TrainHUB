import { useTranslation } from 'react-i18next'
import type { BookingStatus } from '../../api/types'

const styles: Record<BookingStatus, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  accepted: 'bg-brand-50 text-brand-700 border-brand-200',
  declined: 'bg-red-50 text-red-700 border-red-200',
  cancelled: 'bg-ink-100 text-ink-500 border-ink-200',
}

export default function StatusBadge({ status }: { status: BookingStatus }) {
  const { t } = useTranslation()
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${styles[status]}`}>
      {t(`bookings.status_${status}`)}
    </span>
  )
}
