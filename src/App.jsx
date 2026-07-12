import { useMemo, useState } from 'react'
import MapView from './components/MapView'
import ControlPanel from './components/ControlPanel'
import { useGeolocation } from './hooks/useGeolocation'
import { useParkedLocation } from './hooks/useParkedLocation'
import { haversineMeters } from './utils/distance'

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

export default function App() {
  const { position, error: geoError, loading } = useGeolocation({ watch: true })
  const { spot, parkHere, clearSpot } = useParkedLocation()
  const [following, setFollowing] = useState(false)
  const [shareStatus, setShareStatus] = useState('')
  const [mapError, setMapError] = useState('')

  const distanceMeters = useMemo(
    () => (position && spot ? haversineMeters(position, spot) : null),
    [position, spot]
  )

  const handlePark = () => {
    if (!position) return
    parkHere(position)
    setShareStatus('')
  }

  const handleClear = () => {
    clearSpot()
    setFollowing(false)
    setShareStatus('')
  }

  const handleShare = async () => {
    if (!spot) return
    const mapsUrl = `https://www.google.com/maps?q=${spot.lat},${spot.lng}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My parked cycle',
          text: 'Here\u2019s where I parked my cycle:',
          url: mapsUrl
        })
        setShareStatus('Shared.')
      } catch {
        // user cancelled the share sheet — no error needed
      }
    } else {
      try {
        await navigator.clipboard.writeText(mapsUrl)
        setShareStatus('Link copied to clipboard.')
      } catch {
        setShareStatus(mapsUrl)
      }
    }
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar__brand">
          <span className="topbar__dot" />
          Park My Cycle
        </div>
        <span className="topbar__status">
          {loading && 'Locating\u2026'}
          {!loading && geoError && 'Location unavailable'}
          {!loading && !geoError && position && 'Live'}
        </span>
      </header>

      {(geoError || mapError) && (
        <div className="banner banner--error">{geoError || mapError}</div>
      )}

      <MapView
        apiKey={API_KEY}
        userPosition={position}
        parkedSpot={spot}
        following={following}
        onMapError={setMapError}
      />

      <ControlPanel
        spot={spot}
        distanceMeters={distanceMeters}
        following={following}
        onPark={handlePark}
        onToggleFollow={() => setFollowing((f) => !f)}
        onShare={handleShare}
        onClear={handleClear}
        shareStatus={shareStatus}
      />
    </div>
  )
}
