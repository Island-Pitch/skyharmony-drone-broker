export function Marketplace() {
  return (
    <div className="page coming-soon-page">
      <div className="coming-soon-container">
        <div className="coming-soon-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" />
          </svg>
        </div>
        <h2>Operator Marketplace</h2>
        <p className="coming-soon-label">Coming Soon</p>
        <p className="coming-soon-description">
          Browse and book drone services from verified operators.
          Compare pricing, reviews, and fleet capabilities across regions.
        </p>
      </div>
    </div>
  );
}
