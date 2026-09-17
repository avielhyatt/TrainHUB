import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client'
import type { PublicTrainerDetail as PublicTrainerDetailType } from '../api/types'
import LanguageSwitcher from '../components/LanguageSwitcher'
import Spinner from '../components/ui/Spinner'
import EmptyState from '../components/ui/EmptyState'
import Card from '../components/ui/Card'
import { RatingBadge } from '../components/ui/RatingStars'
import Avatar from '../components/ui/Avatar'

export default function PublicTrainerDetail() {
  const { t, i18n } = useTranslation()
  const { trainerId } = useParams<{ trainerId: string }>()
  const [trainer, setTrainer] = useState<PublicTrainerDetailType | null | 'not_found'>(null)

  useEffect(() => {
    if (!trainerId) return
    api
      .get<PublicTrainerDetailType>(`/public/trainers/${trainerId}`)
      .then(({ data }) => setTrainer(data))
      .catch(() => setTrainer('not_found'))
  }, [trainerId])

  return (
    <div className="min-h-screen bg-ink-50">
      <header className="border-b border-ink-100 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4">
          <Link to="/trainers" className="flex items-center gap-2 text-xl font-bold text-brand-700">
            <span>🏋️</span>
            <span>{t('app.name')}</span>
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link to="/login" className="text-sm font-medium text-ink-600 hover:text-brand-700">
              {t('landing.cta_login')}
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-5 py-10">
        <Link to="/trainers" className="mb-4 inline-block text-sm text-ink-500 hover:text-brand-700">
          ← {t('common.back')}
        </Link>

        {trainer === null ? (
          <Spinner />
        ) : trainer === 'not_found' ? (
          <EmptyState icon="🚫" text={t('publicTrainers.not_found')} />
        ) : (
          <>
            <Card className="mb-6">
              <div className="flex items-start gap-4">
                <Avatar
                  photoUrl={trainer.photo_url}
                  firstName={trainer.first_name}
                  lastName={trainer.last_name}
                  verified={trainer.is_verified}
                  size="xl"
                />
                <div>
                  <h1 className="text-2xl font-bold text-ink-900">
                    {trainer.first_name} {trainer.last_name}
                  </h1>
                  {trainer.specialty && <p className="mt-1 font-medium text-brand-600">{trainer.specialty}</p>}
                  {trainer.description && <p className="mt-3 text-ink-600">{trainer.description}</p>}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
                {trainer.avg_rating != null ? (
                  <span className="font-semibold text-amber-600">
                    ⭐ {trainer.avg_rating}/10 · {trainer.review_count} {t('publicTrainers.reviews')}
                  </span>
                ) : (
                  <span className="text-ink-400">{t('publicTrainers.no_reviews_yet')}</span>
                )}
                {trainer.cost_per_hour != null && (
                  <span className="font-semibold text-ink-700">
                    {t('trainee.cost_per_hour')}: {trainer.cost_per_hour} {t('dashboard.currency')}/{t('trainee.hour_abbr')}
                  </span>
                )}
              </div>
            </Card>

            <h2 className="mb-3 font-semibold text-ink-800">{t('publicTrainers.reviews')}</h2>
            {trainer.reviews.length === 0 ? (
              <EmptyState text={t('publicTrainers.no_reviews_yet')} />
            ) : (
              <div className="flex flex-col gap-3">
                {trainer.reviews.map((review, idx) => (
                  <Card key={idx}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Avatar photoUrl={review.patient_photo_url} firstName={review.patient_first_name} size="sm" />
                        <span className="font-medium text-ink-700">{review.patient_first_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <RatingBadge rating={review.rating} />
                        <span className="text-xs text-ink-400">
                          {new Date(review.created_at).toLocaleDateString(i18n.language)}
                        </span>
                      </div>
                    </div>
                    {review.comment && <p className="mt-2 text-sm text-ink-600">{review.comment}</p>}
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
