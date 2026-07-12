import { formatDistance, compassLabel } from '../utils/distance'

export default function StatCard({ meters, bearing, following }) {
  const [value, unit] = formatDistance(meters).split(' ')
  const rotation = bearing ?? 0

  return (
    <div className={`stat-card ${following ? 'stat-card--following' : ''}`}>
      <div className="compass">
        <svg viewBox="0 0 56 56" width="56" height="56">
          <circle cx="28" cy="28" r="26" fill="none" stroke="currentColor" strokeOpacity="0.18" strokeWidth="1.5" />
          <g style={{ transform: `rotate(${rotation}deg)`, transformOrigin: '28px 28px', transition: 'transform 0.4s ease' }}>
            <path d="M28 10 L34 30 L28 26 L22 30 Z" fill="currentColor" />
          </g>
        </svg>
        <span className="compass__label">{compassLabel(bearing)}</span>
      </div>

      <div className="stat-card__divider" />

      <div className="stat-card__value-block">
        <span className="stat-card__label">
          {following ? 'Heading to your cycle' : 'Distance to cycle'}
        </span>
        <div className="stat-card__value-row">
          <span className="stat-card__value">{value}</span>
          <span className="stat-card__unit">{unit}</span>
        </div>
      </div>
    </div>
  )
}
