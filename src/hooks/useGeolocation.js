import { useEffect, useRef, useState } from 'react'

// Tracks the device's live position. Returns { position, error, accuracy, loading }.
export function useGeolocation({ watch = true } = {}) {
  const [position, setPosition] = useState(null)
  const [accuracy, setAccuracy] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const watchIdRef = useRef(null)

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setError('Location isn\u2019t available on this device.')
      setLoading(false)
      return
    }

    const onSuccess = (pos) => {
      setPosition({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      })
      setAccuracy(pos.coords.accuracy)
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
