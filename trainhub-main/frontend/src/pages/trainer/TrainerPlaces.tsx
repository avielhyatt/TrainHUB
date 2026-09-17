import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { api, apiErrorMessage } from '../../api/client'
import type { Place } from '../../api/types'
import Card from '../../components/ui/Card'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import { Input } from '../../components/ui/Field'
import LocationPicker from '../../components/LocationPicker'
import PlaceMapView from '../../components/PlaceMapView'

export default function TrainerPlaces() {
  const { t } = useTranslation()
  const [places, setPlaces] = useState<Place[] | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [details, setDetails] = useState('')
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  function load() {
    api.get<Place[]>('/trainers/me/places').then(({ data }) => setPlaces(data))
  }

  useEffect(load, [])

  function openAddModal() {
    setName('')
    setAddress('')
    setDetails('')
    setLatitude(null)
    setLongitude(null)
    setError('')
    setModalOpen(true)
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await api.post('/trainers/me/places', { name, address: address || null, details: details || null, latitude, longitude })
      setModalOpen(false)
      load()
    } catch (err) {
      setError(apiErrorMessage(err, t('common.error')))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    setPlaces((prev) => prev?.filter((p) => p.id !== id) ?? null)
    await api.delete(`/trainers/me/places/${id}`)
  }

  return (
    <div>
      <PageHeader
        title={t('places.title')}
        action={<Button onClick={openAddModal}>+ {t('places.add_place')}</Button>}
      />

      {places === null ? (
        <Spinner />
      ) : places.length === 0 ? (
        <EmptyState icon="📍" text={t('places.no_places')} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {places.map((place) => (
            <Card key={place.id} className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-ink-800">{place.name}</h3>
                  {place.address && <p className="mt-1 text-sm text-ink-500">{place.address}</p>}
                  {place.details && <p className="mt-0.5 text-sm text-ink-400">{place.details}</p>}
                </div>
                <Button variant="danger" size="sm" onClick={() => handleDelete(place.id)}>
                  {t('common.delete')}
                </Button>
              </div>
              <PlaceMapView latitude={place.latitude} longitude={place.longitude} address={place.address} name={place.name} />
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={t('places.add_place')}>
        <form onSubmit={handleAdd} className="flex flex-col gap-4">
          <Input label={t('places.name')} required value={name} onChange={(e) => setName(e.target.value)} />
          <Input
            label={t('places.address')}
            placeholder={t('places.address_placeholder')}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
          <Input
            label={t('places.details')}
            hint={t('places.details_hint')}
            placeholder={t('places.details_placeholder')}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
          />
          <div>
            <span className="mb-1.5 block text-sm font-medium text-ink-700">{t('places.pick_on_map')}</span>
            <span className="mb-2 block text-xs text-ink-400">{t('places.pick_on_map_desc')}</span>
            <LocationPicker
              latitude={latitude}
              longitude={longitude}
              onChange={(lat, lng) => {
                setLatitude(lat)
                setLongitude(lng)
              }}
            />
          </div>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          <Button type="submit" loading={saving}>
            {t('common.add')}
          </Button>
        </form>
      </Modal>
    </div>
  )
}
