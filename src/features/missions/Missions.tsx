export function Missions() {
  return (
    <div className="page coming-soon-page">
      <div className="coming-soon-container">
        <div className="coming-soon-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>
        <h2>Mission Control</h2>
        <p className="coming-soon-label">Coming Soon</p>
        <p className="coming-soon-description">
          Real-time mission planning, waypoint routing, and live drone telemetry.
          Coordinate multi-drone formations across show sites.
        </p>
      </div>
    </div>
  );
}
