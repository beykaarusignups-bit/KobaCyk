import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'park-my-cycle:spot'

// Persists the parked cycle's location on-device via localStorage.
// No backend or database involved — the data never leaves the phone
// unless the user explicitly shares it.
export function useParkedLocation() {
  const [spot, setSpot] = useState(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setSpot(JSON.parse(raw))
    } catch {
      setSpot(null)
    }
  }, [])

  const parkHere = useCallback((position) => {
    if (!position) return
    const entry = {
      lat: position.lat,
      lng: position.lng,
      timestamp: Date.now()
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entry))
    setSpot(entry)
  }, [])

  const clearSpot = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setSpot(null)
  }, [])

  return { spot, parkHere, clearSpot }
}
