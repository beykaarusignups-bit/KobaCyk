import { formatDistance } from '../utils/distance'

export default function DistanceReadout({ meters, hasSpot }) {
  return (
    <div className="readout">
      <span className="readout__label">
        {hasSpot ? 'Distance to cycle' : 'No cycle parked yet'}
      </span>
      <span className="readout__value">
        {hasSpot ? formatDistance(meters) : '--.--'}
      </span>
    </div>
  )
}
