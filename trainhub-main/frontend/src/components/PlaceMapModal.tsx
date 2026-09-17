import Modal from './ui/Modal'
import PlaceMapView from './PlaceMapView'
import type { Place } from '../api/types'

interface Props {
  place: Place | null
  onClose: () => void
}

export default function PlaceMapModal({ place, onClose }: Props) {
  if (!place) return null
  return (
    <Modal open={!!place} onClose={onClose} title={place.name}>
      <div className="flex flex-col gap-3">
        {place.address && <p className="text-sm text-ink-600">{place.address}</p>}
        {place.details && <p className="text-sm text-ink-500">{place.details}</p>}
        <PlaceMapView latitude={place.latitude} longitude={place.longitude} address={place.address} name={place.name} />
      </div>
    </Modal>
  )
}
