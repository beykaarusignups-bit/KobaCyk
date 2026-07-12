let loadPromise = null

// Injects the Google Maps JS SDK script tag exactly once and resolves
// when window.google.maps is ready to use.
export function loadGoogleMaps(apiKey) {
  if (loadPromise) return loadPromise

  loadPromise = new Promise((resolve, reject) => {
    if (window.google?.maps) {
      resolve(window.google.maps)
      return
    }

    if (!apiKey) {
      reject(new Error('Missing Google Maps API key. Add VITE_GOOGLE_MAPS_API_KEY to your .env file.'))
      return
    }

    const callbackName = '__parkMyCycleMapsInit'
    window[callbackName] = () => {
      resolve(window.google.maps)
      delete window[callbackName]
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry&callback=${callbackName}&loading=async`
    script.async = true
    script.defer = true
    script.onerror = () => reject(new Error('Failed to load Google Maps. Check your API key and network connection.'))
    document.head.appendChild(script)
  })

  return loadPromise
}
