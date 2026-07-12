import DistanceReadout from './DistanceReadout'

function timeAgo(timestamp) {
  const diffMs = Date.now() - timestamp
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

export default function ControlPanel({
  spot,
  distanceMeters,
  following,
  onPark,
  onToggleFollow,
  onShare,
  onClear,
  shareStatus
}) {
  return (
    <div className={`panel ${following ? 'panel--following' : ''}`}>
      <DistanceReadout meters={distanceMeters} hasSpot={!!spot} />

      {spot && (
        <p className="panel__meta">Parked {timeAgo(spot.timestamp)}</p>
      )}

      <div className="panel__actions">
        <button className="btn btn--primary" onClick={onPark}>
          {spot ? 'Update parked spot' : 'Park my cycle here'}
        </button>

        <button
          className={`btn ${following ? 'btn--accent-active' : 'btn--accent'}`}
          onClick={onToggleFollow}
          disabled={!spot}
        >
          {following ? 'Stop following' : 'Follow the cycle'}
        </button>

        <div className="panel__row">
          <button className="btn btn--ghost" onClick={onShare} disabled={!spot}>
            Share location
          </button>
          <button className="btn btn--ghost btn--danger" onClick={onClear} disabled={!spot}>
            Clear
          </button>
        </div>

        {shareStatus && <p className="panel__status">{shareStatus}</p>}
      </div>
    </div>
  )
}
