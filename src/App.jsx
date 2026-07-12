import { useMemo, useState } from 'react'
import MapView from './components/MapView'
import StatCard from './components/StatCard'
import Dock from './components/Dock'
import { IconPin, IconBike } from './components/icons'
import { useGeolocation } from './hooks/useGeolocation'
import { useParkedLocation } from './hooks/useParkedLocation'
import { haversineMeters, bearingDegrees } from './utils/distance'

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

export default function App() {
  const { position, accuracy, error: geoError, loading } = useGeolocation({ watch: true })
  const { spot, parkHere, clearSpot, storageError } = useParkedLocation()
  const [following, setFollowing] = useState(false)
  const [shareStatus, setShareStatus] = useState('')
  const [mapError, setMapError] = useState('')

  const distanceMeters = useMemo(
    () => (position && spot ? haversineMeters(position, spot) : null),
    [position, spot]
  )

  const bearing = useMemo(
    () => (position && spot ? bearingDegrees(position, spot) : null),
    [position, spot]
  )

  const handlePark = () => {
    if (!position) return
    parkHere(position)
    setShareStatus('Cycle parked.')
    setTimeout(() => setShareStatus(''), 2500)
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

    setTimeout(() => setShareStatus(''), 3500)
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar__brand">
          <span className="topbar__brand-icon">
            <IconPin />
          </span>
          <span className="topbar__title">Park My Cycle</span>
        </div>
        <div className="topbar__status">
          <span className={`status-dot ${loading || geoError ? 'status-dot--warn' : ''}`} />
          {loading && 'Locating\u2026'}
          {!loading && geoError && 'Offline'}
          {!loading && !geoError && position && 'Live'}
        </div>
      </header>

      {(geoError || mapError || storageError) && (
        <div className="banner banner--error">{geoError || mapError || storageError}</div>
      )}

      <MapView
        apiKey={API_KEY}
        userPosition={position}
        accuracy={accuracy}
        parkedSpot={spot}
        following={following}
        onMapError={setMapError}
      />

      <div className="stage">
        {!spot && (
          <div className="prompt-card">
            <span className="prompt-card__icon">
              <IconBike />
            </span>
            <div>
              <p className="prompt-card__title">No cycle parked yet</p>
              <p className="prompt-card__body">Tap Park below to drop a pin here.</p>
            </div>
          </div>
        )}

        {spot && (
          <StatCard meters={distanceMeters} bearing={bearing} following={following} />
        )}

        {shareStatus && <div className="toast">{shareStatus}</div>}
      </div>

      <Dock
        spot={spot}
        following={following}
        onPark={handlePark}
        onToggleFollow={() => setFollowing((f) => !f)}
        onShare={handleShare}
        onClear={handleClear}
      />
    </div>
  )
}
