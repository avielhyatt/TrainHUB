import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { api } from '../../api/client'
import type { TrainerOfPatient } from '../../api/types'
import Card from '../../components/ui/Card'
import PageHeader from '../../components/ui/PageHeader'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import Button from '../../components/ui/Button'
import Avatar from '../../components/ui/Avatar'

export default function TraineeTrainers() {
  const { t } = useTranslation()
  const [trainers, setTrainers] = useState<TrainerOfPatient[] | null>(null)

  useEffect(() => {
    api.get<TrainerOfPatient[]>('/patients/me/trainers').then(({ data }) => setTrainers(data))
  }, [])

  return (
    <div>
      <PageHeader title={t('trainee.my_trainers_title')} />

      {trainers === null ? (
        <Spinner />
      ) : trainers.length === 0 ? (
        <EmptyState icon="🧑‍🏫" text={t('trainee.no_trainers')} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {trainers.map(({ relationship_id, user, profile }) => (
            <Card key={relationship_id} className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <Avatar
                  photoUrl={user.photo_url}
                  firstName={user.first_name}
                  lastName={user.last_name}
                  verified={user.is_verified}
                  size="lg"
                />
                <div>
                  <h3 className="font-semibold text-ink-800">
                    {user.first_name} {user.last_name}
                  </h3>
                  {profile?.specialty && <p className="text-sm text-brand-600">{profile.specialty}</p>}
                </div>
              </div>
              <div>
                {profile?.description && (
                  <p className="mt-1.5 line-clamp-3 text-sm text-ink-500">{profile.description}</p>
                )}
                {profile?.cost_per_hour != null && (
                  <p className="mt-2 text-sm font-medium text-ink-700">
                    {t('trainee.cost_per_hour')}: {profile.cost_per_hour} {t('dashboard.currency')}/{t('trainee.hour_abbr')}
                  </p>
                )}
              </div>
              <Link to={`/trainee/trainers/${user.id}`} className="mt-auto">
                <Button className="w-full">{t('trainee.book_training')}</Button>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
