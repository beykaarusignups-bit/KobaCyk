import { useEffect, useRef } from 'react'
import { loadGoogleMaps } from '../utils/loadGoogleMaps'
import { IconLocate } from './icons'
import { haversineMeters } from '../utils/distance'

const MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#181D25' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#12161D' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#6b7385' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#242B36' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#12161D' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#2A323F' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#323C4B' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#12161D' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0F1B27' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#151A21' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#2A323F' }] },
  { featureType: 'administrative.land_parcel', stylers: [{ visibility: 'off' }] }
]

// Minimum movement (meters) and time (ms) before we recompute a walking
// route — keeps "Follow" smooth instead of hammering the Directions API
// (and flickering the route) on every single GPS tick.
const ROUTE_MIN_DISTANCE_M = 15
const ROUTE_MIN_INTERVAL_MS = 8000

function lerp(a, b, t) {
  return a + (b - a) * t
}

export default function MapView({ apiKey, userPosition, accuracy, parkedSpot, following, onMapError }) {
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const userDotMarker = useRef(null)
  const accuracyCircle = useRef(null)
  const parkedMarker = useRef(null)
  const pulseCircle = useRef(null)
  const pulseFrame = useRef(null)
  const directionsRenderer = useRef(null)
  const directionsService = useRef(null)
  const hasFitBounds = useRef(false)

  const displayedPos = useRef(null) // what's currently rendered on the map
  const moveFrame = useRef(null)

  const lastRoutePos = useRef(null)
  const lastRouteTime = useRef(0)

  // Initialize map once.
  useEffect(() => {
    let cancelled = false

    loadGoogleMaps(apiKey)
      .then((maps) => {
        if (cancelled || !mapRef.current) return
        mapInstance.current = new maps.Map(mapRef.current, {
          center: { lat: 20.5937, lng: 78.9629 },
          zoom: 17,
          disableDefaultUI: true,
          zoomControl: true,
          styles: MAP_STYLE
        })
        directionsService.current = new maps.DirectionsService()
        directionsRenderer.current = new maps.DirectionsRenderer({
          suppressMarkers: true,
          polylineOptions: {
            strokeColor: '#B4FF39',
            strokeWeight: 4,
            strokeOpacity: 0.9
          }
        })
        directionsRenderer.current.setMap(mapInstance.current)
      })
      .catch((err) => onMapError?.(err.message))

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey])

  // Update / create the live user marker, animating smoothly between fixes
  // instead of snapping — this is what makes the dot feel steady rather
  // than jumpy even though raw GPS fixes arrive in discrete jumps.
  useEffect(() => {
    const maps = window.google?.maps
    if (!maps || !mapInstance.current || !userPosition) return

    if (!userDotMarker.current) {
      userDotMarker.current = new maps.Marker({
        map: mapInstance.current,
        position: userPosition,
        icon: {
          path: maps.SymbolPath.CIRCLE,
          scale: 6.5,
          fillColor: '#4FA8FF',
          fillOpacity: 1,
          strokeColor: '#0E1A24',
          strokeWeight: 2.5
        },
        zIndex: 10,
        title: 'You are here'
      })
      accuracyCircle.current = new maps.Circle({
        map: mapInstance.current,
        center: userPosition,
        radius: accuracy || 15,
        fillColor: '#4FA8FF',
        fillOpacity: 0.12,
        strokeColor: '#4FA8FF',
        strokeOpacity: 0.25,
        strokeWeight: 1,
        clickable: false
      })
      displayedPos.current = userPosition
      mapInstance.current.setCenter(userPosition)
    } else {
      const from = displayedPos.current || userPosition
      const to = userPosition
      const start = performance.now()
      const durationMs = 450

      if (moveFrame.current) cancelAnimationFrame(moveFrame.current)

      const tick = (now) => {
        const t = Math.min(1, (now - start) / durationMs)
        const eased = 1 - Math.pow(1 - t, 3)
        const pos = {
          lat: lerp(from.lat, to.lat, eased),
          lng: lerp(from.lng, to.lng, eased)
        }
        userDotMarker.current?.setPosition(pos)
        accuracyCircle.current?.setCenter(pos)
        if (t < 1) {
          moveFrame.current = requestAnimationFrame(tick)
        } else {
          displayedPos.current = to
        }
      }
      moveFrame.current = requestAnimationFrame(tick)
    }

    if (!hasFitBounds.current && !parkedMarker.current) {
      mapInstance.current.setCenter(userPosition)
      hasFitBounds.current = true
    }

    return () => {
      if (moveFrame.current) cancelAnimationFrame(moveFrame.current)
    }
  }, [userPosition])

  // Keep the accuracy circle's radius in sync with the device's reported accuracy.
  useEffect(() => {
    if (accuracyCircle.current && accuracy) {
      accuracyCircle.current.setRadius(accuracy)
    }
  }, [accuracy])

  // Create / update the parked marker plus its radar-ping pulse.
  useEffect(() => {
    const maps = window.google?.maps
    if (!maps || !mapInstance.current) return

    if (!parkedSpot) {
      parkedMarker.current?.setMap(null)
      parkedMarker.current = null
      pulseCircle.current?.setMap(null)
      pulseCircle.current = null
      if (pulseFrame.current) cancelAnimationFrame(pulseFrame.current)
      return
    }

    const pos = { lat: parkedSpot.lat, lng: parkedSpot.lng }

    if (!parkedMarker.current) {
      parkedMarker.current = new maps.Marker({
        map: mapInstance.current,
        position: pos,
        icon: {
          path: 'M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7z',
          fillColor: '#FF6B35',
          fillOpacity: 1,
          strokeColor: '#12161D',
          strokeWeight: 1.5,
          scale: 1.6,
          anchor: new maps.Point(12, 22)
        },
        zIndex: 20,
        title: 'Your cycle'
      })

      pulseCircle.current = new maps.Circle({
        map: mapInstance.current,
        center: pos,
        radius: 0,
        strokeColor: '#FF6B35',
        strokeOpacity: 0.5,
        strokeWeight: 1,
        fillColor: '#FF6B35',
        fillOpacity: 0.18
      })

      const start = performance.now()
      const durationMs = 2200
      const maxRadius = 40

      const tick = (now) => {
        const t = ((now - start) % durationMs) / durationMs
        pulseCircle.current?.setRadius(maxRadius * t)
        pulseCircle.current?.setOptions({
          fillOpacity: 0.22 * (1 - t),
          strokeOpacity: 0.5 * (1 - t)
        })
        pulseFrame.current = requestAnimationFrame(tick)
      }
      pulseFrame.current = requestAnimationFrame(tick)

      mapInstance.current.setCenter(pos)
    } else {
      parkedMarker.current.setPosition(pos)
      pulseCircle.current?.setCenter(pos)
    }

    return () => {
      if (pulseFrame.current) cancelAnimationFrame(pulseFrame.current)
    }
  }, [parkedSpot])

  // Draw / clear the walking route when "follow" mode is active.
  // Throttled so it recomputes only on meaningful movement, not every GPS tick.
  useEffect(() => {
    const maps = window.google?.maps
    if (!maps || !directionsService.current || !directionsRenderer.current) return

    if (!following || !userPosition || !parkedSpot) {
      directionsRenderer.current.setDirections({ routes: [] })
      lastRoutePos.current = null
      return
    }

    const now = performance.now()
    const last = lastRoutePos.current
    const movedEnough = !last || haversineMeters(last, userPosition) >= ROUTE_MIN_DISTANCE_M
    const enoughTimePassed = now - lastRouteTime.current >= ROUTE_MIN_INTERVAL_MS

    if (last && !movedEnough && !enoughTimePassed) return

    lastRoutePos.current = userPosition
    lastRouteTime.current = now

    directionsService.current.route(
      {
        origin: userPosition,
        destination: { lat: parkedSpot.lat, lng: parkedSpot.lng },
        travelMode: maps.TravelMode.WALKING
      },
      (result, status) => {
        if (status === 'OK') {
          directionsRenderer.current.setDirections(result)
          const bounds = new maps.LatLngBounds()
          bounds.extend(userPosition)
          bounds.extend(parkedSpot)
          mapInstance.current.fitBounds(bounds, 80)
        }
      }
    )
  }, [following, userPosition, parkedSpot])

  const handleRecenter = () => {
    if (!mapInstance.current || !userPosition) return
    mapInstance.current.panTo(userPosition)
    mapInstance.current.setZoom(17)
  }

  return (
    <div className="map-wrap">
      <div ref={mapRef} className="map-canvas" />
      <button className="fab" onClick={handleRecenter} aria-label="Recenter on my location">
        <IconLocate />
      </button>
    </div>
  )
}
