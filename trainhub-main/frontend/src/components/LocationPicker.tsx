import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'

interface Props {
  latitude: number | null
  longitude: number | null
  onChange: (lat: number, lng: number) => void
}

const ISRAEL_CENTER: [number, number] = [31.5, 34.9]

function ClickHandler({ onChange }: { onChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

export default function LocationPicker({ latitude, longitude, onChange }: Props) {
  const hasPoint = latitude != null && longitude != null
  const center: [number, number] = hasPoint ? [latitude, longitude] : ISRAEL_CENTER

  return (
    <div className="h-64 w-full overflow-hidden rounded-xl border border-ink-200">
      <MapContainer center={center} zoom={hasPoint ? 14 : 7} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onChange={onChange} />
        {hasPoint && <Marker position={[latitude, longitude]} />}
      </MapContainer>
    </div>
  )
}
