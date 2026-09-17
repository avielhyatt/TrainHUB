import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import { useTranslation } from 'react-i18next'

interface Props {
  latitude: number | null
  longitude: number | null
  address?: string | null
  name?: string
}

export default function PlaceMapView({ latitude, longitude, address, name }: Props) {
  const { t } = useTranslation()
  const hasPoint = latitude != null && longitude != null
  const fallbackQuery = address || name || ''
  const canOpenLinks = hasPoint || !!fallbackQuery

  const googleUrl = hasPoint
    ? `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fallbackQuery)}`
  const wazeUrl = hasPoint
    ? `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`
    : `https://waze.com/ul?q=${encodeURIComponent(fallbackQuery)}`

  return (
    <div className="flex flex-col gap-3">
      {hasPoint && (
        <div className="h-40 w-full overflow-hidden rounded-xl border border-ink-200">
          <MapContainer
            center={[latitude, longitude]}
            zoom={15}
            style={{ height: '100%', width: '100%' }}
            dragging={false}
            scrollWheelZoom={false}
            doubleClickZoom={false}
            zoomControl={false}
            attributionControl={false}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={[latitude, longitude]} />
          </MapContainer>
        </div>
      )}
      {canOpenLinks && (
        <div className="flex gap-2">
          <a
            href={googleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 rounded-xl border border-ink-200 px-3 py-2 text-center text-sm font-medium text-ink-700 hover:bg-ink-50"
          >
            {t('places.open_google_maps')}
          </a>
          <a
            href={wazeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 rounded-xl border border-ink-200 px-3 py-2 text-center text-sm font-medium text-ink-700 hover:bg-ink-50"
          >
            {t('places.open_waze')}
          </a>
        </div>
      )}
    </div>
  )
}
