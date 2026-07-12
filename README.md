# Park My Cycle

Mark exactly where you parked your cycle, find your way back to it, and share the spot with someone else — all from your phone, with no account or backend required.

## Features

- **Live location** — shows your current position on a Google Map as you move.
- **Park my cycle here** — saves your current spot as the parked location, right on your device (`localStorage`), not a database.
- **Persists across sessions** — close the app, come back later, and your parked spot is still there.
- **Distance readout** — a live, odometer-style readout of how far you are from the cycle.
- **Follow the cycle** — draws a walking route from wherever you are back to the parked spot, updating as you move.
- **Share location** — sends a Google Maps link via your device's native share sheet (or copies it to your clipboard).
- **Clear** — wipes the saved spot when you're done.

## 1. Get a Google Maps API key

1. Go to the [Google Cloud Console](https://console.cloud.google.com/google/maps-apis).
2. Create a project (or use an existing one).
3. Enable the **Maps JavaScript API** and the **Directions API**.
4. Create an API key under **Credentials**.
5. (Recommended) Restrict the key to your domain(s) under **API restrictions** before going live.

## 2. Run it locally

```bash
npm install
cp .env.example .env
# then edit .env and paste your key into VITE_GOOGLE_MAPS_API_KEY
npm run dev
```

Open the local URL Vite prints (usually `http://localhost:5173`). Your browser will ask for location permission — allow it.

> Geolocation requires a secure context. `localhost` works fine for dev; in production you need HTTPS (both Vercel and Netlify provide this automatically).

## 3. Build for production

```bash
npm run build
npm run preview   # optional: preview the production build locally
```

The static output lands in `dist/`.

## 4. Deploy

### Vercel
1. Push this repo to GitHub.
2. Import it at [vercel.com/new](https://vercel.com/new).
3. Add an environment variable: `VITE_GOOGLE_MAPS_API_KEY` = your key.
4. Deploy. `vercel.json` is already configured.

### Netlify
1. Push this repo to GitHub.
2. Import it at [app.netlify.com](https://app.netlify.com).
3. Add the same environment variable under **Site settings → Environment variables**.
4. Deploy. `netlify.toml` is already configured.

### GitHub Pages
Vite apps can also be deployed to Pages, but since this app needs an environment variable baked in at build time, Vercel or Netlify (which support build-time env vars out of the box) are simpler. If you'd rather use Pages, build locally with the key set and push the `dist/` folder to a `gh-pages` branch.

## Project structure

```
src/
  components/
    MapView.jsx        Map rendering, markers, radar-ping pulse, route drawing
    ControlPanel.jsx    Bottom action panel (park / follow / share / clear)
    DistanceReadout.jsx Live distance display
  hooks/
    useGeolocation.js      Live device position via watchPosition
    useParkedLocation.js   Saves/reads the parked spot from localStorage
  utils/
    distance.js         Haversine distance + bearing math
    loadGoogleMaps.js   Lazy-loads the Google Maps SDK
  App.jsx
  index.css
```

## Notes on privacy

The parked location is stored only in the browser's `localStorage` on the user's own device. Nothing is sent to a server unless the user taps **Share location**, which hands a Google Maps link to the device's native share sheet (or clipboard) — under the user's explicit control.

## License

MIT — do whatever you'd like with this.
