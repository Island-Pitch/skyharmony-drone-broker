import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div className="not-found-page">
      <div className="not-found-container">
        <div className="not-found-drone">
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none" aria-hidden="true">
            {/* Drone body */}
            <rect x="45" y="50" width="30" height="20" rx="4" stroke="#D4A843" strokeWidth="2" fill="none" />
            {/* Propeller arms */}
            <line x1="45" y1="55" x2="20" y2="35" stroke="#D4A843" strokeWidth="1.5" />
            <line x1="75" y1="55" x2="100" y2="35" stroke="#D4A843" strokeWidth="1.5" />
            <line x1="45" y1="65" x2="20" y2="85" stroke="#D4A843" strokeWidth="1.5" />
            <line x1="75" y1="65" x2="100" y2="85" stroke="#D4A843" strokeWidth="1.5" />
            {/* Propellers (spinning) */}
            <ellipse cx="20" cy="35" rx="12" ry="3" stroke="#0A3D62" strokeWidth="1" transform="rotate(-20 20 35)" />
            <ellipse cx="100" cy="35" rx="12" ry="3" stroke="#0A3D62" strokeWidth="1" transform="rotate(20 100 35)" />
            <ellipse cx="20" cy="85" rx="12" ry="3" stroke="#0A3D62" strokeWidth="1" transform="rotate(20 20 85)" />
            <ellipse cx="100" cy="85" rx="12" ry="3" stroke="#0A3D62" strokeWidth="1" transform="rotate(-20 100 85)" />
            {/* Question mark on drone */}
            <text x="60" y="66" textAnchor="middle" fill="#D4A843" fontSize="16" fontWeight="bold">?</text>
            {/* Signal waves (lost signal) */}
            <path d="M52 45C52 45 56 38 60 38C64 38 68 45 68 45" stroke="#C0392B" strokeWidth="1.5" fill="none" strokeDasharray="3 2" />
            <path d="M48 40C48 40 54 30 60 30C66 30 72 40 72 40" stroke="#C0392B" strokeWidth="1" fill="none" strokeDasharray="3 2" opacity="0.5" />
          </svg>
        </div>

        <h1 className="not-found-code">404</h1>
        <h2 className="not-found-title">This drone went off-course</h2>
        <p className="not-found-message">
          Looks like this flight path doesn't exist in our airspace.
          The drone has been recalled to base — no custody event required.
        </p>

        <div className="not-found-actions">
          <Link to="/dashboard" className="btn-primary">
            Return to Dashboard
          </Link>
          <Link to="/" className="btn-secondary">
            Back to Landing
          </Link>
        </div>

        <p className="not-found-hint">
          <em>Ka hoki te manu ki tona ohanga</em> — The bird returns to its home tree
        </p>
      </div>
    </div>
  );
}
