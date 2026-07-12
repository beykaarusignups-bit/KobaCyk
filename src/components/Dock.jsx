import { IconPin, IconNavigation, IconShare, IconTrash } from './icons'

export default function Dock({ spot, following, onPark, onToggleFollow, onShare, onClear }) {
  return (
    <nav className="dock">
      <button className="dock__item dock__item--accent" onClick={onPark}>
        <span className="dock__icon"><IconPin /></span>
        <span className="dock__label">{spot ? 'Update' : 'Park'}</span>
      </button>

      <button
        className={`dock__item ${following ? 'dock__item--active' : ''}`}
        onClick={onToggleFollow}
        disabled={!spot}
      >
        <span className="dock__icon"><IconNavigation /></span>
        <span className="dock__label">Follow</span>
      </button>

      <button className="dock__item" onClick={onShare} disabled={!spot}>
        <span className="dock__icon"><IconShare /></span>
        <span className="dock__label">Share</span>
      </button>

      <button className="dock__item" onClick={onClear} disabled={!spot}>
        <span className="dock__icon"><IconTrash /></span>
        <span className="dock__label">Clear</span>
      </button>
    </nav>
  )
}
