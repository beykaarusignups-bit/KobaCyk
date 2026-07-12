import { useEffect, useRef, useState } from 'react'
import { haversineMeters } from '../utils/distance'

// Tracks the device's live position. Returns { position, error, accuracy, loading }.
// Filters out noisy, low-quality GPS fixes so the marker doesn't jitter/jump
// around when the phone is stationary.
export function useGeolocation({ watch = true } = {}) {
  const [position, setPosition] = useState(null)
  const [accuracy, setAccuracy] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const watchIdRef = useRef(null)
  const lastGoodRef = useRef(null)
  const lastAccuracyRef = useRef(null)

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setError('Location isn\u2019t available on this device.')
      setLoading(false)
      return
    }

    const onSuccess = (pos) => {
      const next = { lat: pos.coords.latitude, lng: pos.coords.longitude }
      const nextAccuracy = pos.coords.accuracy

      // Reject wildly unreliable fixes outright (e.g. degraded signal indoors).
      if (nextAccuracy != null && nextAccuracy > 80) {
        setAccuracy(nextAccuracy)
        setLoading(false)
        return
      }

      const last = lastGoodRef.current
      if (last) {
        const moved = haversineMeters(last, next)
        const noiseFloor = Math.max(nextAccuracy || 0, lastAccuracyRef.current || 0, 8)
        // If the device barely moved relative to the fix's own error margin,
        // treat it as GPS noise and hold the marker steady instead of jittering.
        if (moved < noiseFloor * 0.5) {
          setAccuracy(nextAccuracy)
          setLoading(false)
          return
        }
      }

      lastGoodRef.current = next
      lastAccuracyRef.current = nextAccuracy
      setPosition(next)
      setAccuracy(nextAccuracy)
      setError(null)
      setLoading(false)
    }

    const onError = (err) => {
      setError(
        err.code === 1
          ? 'Location access was denied. Enable it in your browser settings.'
          : 'Couldn\u2019t get your location. Try again in a moment.'
      )
      setLoading(false)
    }

    const options = { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 }

    if (watch) {
      watchIdRef.current = navigator.geolocation.watchPosition(onSuccess, onError, options)
    } else {
      navigator.geolocation.getCurrentPosition(onSuccess, onError, options)
    }

    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [watch])

  return { position, accuracy, error, loading }
}
