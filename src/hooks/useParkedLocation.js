import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'park-my-cycle:spot'

// Persists the parked cycle's location on-device via localStorage.
// No backend or database involved — the data never leaves the phone
// unless the user explicitly shares it.
export function useParkedLocation() {
  const [spot, setSpot] = useState(null)
  const [storageError, setStorageError] = useState('')

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setSpot(JSON.parse(raw))
    } catch {
      setSpot(null)
      setStorageError(
        'This browser is blocking on-device storage, so your parked spot won\u2019t be remembered after you close or refresh the page. Try turning off private/incognito mode, or open this in your regular browser instead of an in-app browser.'
      )
    }
  }, [])

  const parkHere = useCallback((position) => {
    if (!position) return
    const entry = {
      lat: position.lat,
      lng: position.lng,
      timestamp: Date.now()
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entry))
      // Read it straight back — if the browser silently rejected the write
      // (some private-browsing modes do this without throwing), we want to
      // know now rather than finding out on the next page load.
      const confirmed = localStorage.getItem(STORAGE_KEY)
      if (!confirmed) {
        setStorageError(
          'Your parked spot is showing for now, but this browser isn\u2019t saving it — it will disappear if you refresh or close the page. Try disabling private/incognito mode.'
        )
      } else {
        setStorageError('')
      }
    } catch {
      setStorageError(
        'Couldn\u2019t save your parked spot on this device. It will disappear if you refresh or close the page. Try disabling private/incognito mode, or use your regular browser instead of an in-app one.'
      )
    }

    setSpot(entry)
  }, [])

  const clearSpot = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // nothing to do — state clears below regardless
    }
    setSpot(null)
    setStorageError('')
  }, [])

  return { spot, parkHere, clearSpot, storageError }
}
