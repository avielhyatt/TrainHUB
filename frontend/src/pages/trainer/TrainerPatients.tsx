import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { api, apiErrorMessage } from '../../api/client'
import type { PatientLink } from '../../api/types'
import Card from '../../components/ui/Card'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import Avatar from '../../components/ui/Avatar'
import { Input } from '../../components/ui/Field'

function calcAge(birthday: string): number {
  const b = new Date(birthday)
  const today = new Date()
  let age = today.getFullYear() - b.getFullYear()
  const m = today.getMonth() - b.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < b.getDate())) age--
  return age
}

export default function TrainerPatients() {
  const { t } = useTranslation()
  const [patients, setPatients] = useState<PatientLink[] | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  function load() {
    api.get<PatientLink[]>('/trainers/me/patients').then(({ data }) => setPatients(data))
  }

  useEffect(load, [])

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await api.post('/trainers/me/patients', { phone_number: phone })
      setPhone('')
      setModalOpen(false)
      load()
    } catch (err) {
      setError(apiErrorMessage(err, t('common.error')))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(relationshipId: string) {
    if (!window.confirm(t('patients.confirm_delete'))) return
    setPatients((prev) => prev?.filter((p) => p.relationship_id !== relationshipId) ?? null)
    await api.delete(`/trainers/me/patients/${relationshipId}`)
  }

  return (
    <div>
      <PageHeader
        title={t('patients.title')}
        action={<Button onClick={() => setModalOpen(true)}>+ {t('patients.add_patient')}</Button>}
      />

      {patients === null ? (
        <Spinner />
      ) : patients.length === 0 ? (
        <EmptyState icon="🧑‍🤝‍🧑" text={t('patients.no_patients')} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {patients.map(({ relationship_id, user }) => (
            <Card key={relationship_id} className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar
                  photoUrl={user.photo_url}
                  firstName={user.first_name}
                  lastName={user.last_name}
                  verified={user.is_verified}
                />
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-ink-800">
                    {user.first_name} {user.last_name}
                  </h3>
                  <p className="mt-1 text-sm text-ink-500">
                    {user.phone_number} · {t('common.years_old', { age: calcAge(user.birthday) })}
                  </p>
                </div>
              </div>
              <Button variant="danger" size="sm" onClick={() => handleDelete(relationship_id)}>
                {t('common.delete')}
              </Button>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={t('patients.add_patient')}>
        <form onSubmit={handleAdd} className="flex flex-col gap-4">
          <Input
            label={t('auth.phone_number')}
            required
            type="tel"
            inputMode="tel"
            placeholder={t('patients.phone_placeholder')}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          <Button type="submit" loading={saving}>
            {t('common.add')}
          </Button>
        </form>
      </Modal>
    </div>
  )
}
