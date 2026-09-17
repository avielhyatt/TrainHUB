import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import Card from './ui/Card'
import Avatar from './ui/Avatar'
import type { PublicTrainerCard } from '../api/types'

export default function TrainerListCard({ trainer }: { trainer: PublicTrainerCard }) {
  const { t } = useTranslation()
  return (
    <Link to={`/trainers/${trainer.id}`}>
      <Card className="flex h-full flex-col gap-2 transition-shadow hover:shadow-md">
        <div className="flex items-center gap-3">
          <Avatar
            photoUrl={trainer.photo_url}
            firstName={trainer.first_name}
            lastName={trainer.last_name}
            verified={trainer.is_verified}
            size="lg"
          />
          <div>
            <h3 className="font-semibold text-ink-800">
              {trainer.first_name} {trainer.last_name}
            </h3>
            {trainer.specialty && <p className="text-sm font-medium text-brand-600">{trainer.specialty}</p>}
          </div>
        </div>
        {trainer.description && <p className="line-clamp-3 text-sm text-ink-500">{trainer.description}</p>}
        <div className="mt-auto flex items-center justify-between pt-3 text-sm">
          {trainer.avg_rating != null ? (
            <span className="font-semibold text-amber-600">
              ⭐ {trainer.avg_rating}/10 · {trainer.review_count} {t('publicTrainers.reviews')}
            </span>
          ) : (
            <span className="text-ink-400">{t('publicTrainers.no_reviews_yet')}</span>
          )}
          {trainer.cost_per_hour != null && (
            <span className="font-semibold text-ink-700">
              {trainer.cost_per_hour} {t('dashboard.currency')}/{t('trainee.hour_abbr')}
            </span>
          )}
        </div>
      </Card>
    </Link>
  )
}
