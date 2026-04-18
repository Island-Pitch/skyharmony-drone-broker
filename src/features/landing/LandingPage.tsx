import { Link } from 'react-router-dom';

/** Koru spiral — brand icon for SkyHarmony. */
function KoruLogo({ size = 56 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M24 44C24 44 8 36 8 22C8 13.2 14.4 6 24 6C33.6 6 40 13.2 40 22C40 28 36 32 30 32C24 32 21 28 21 24C21 20 23 18 26 18C29 18 30 20 30 22"
        stroke="#D4A843"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

/** Small koru motif used as a section divider. */
function KoruDivider() {
  return (
    <div className="landing-divider">
      <svg
        width="80"
        height="24"
        viewBox="0 0 80 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M0 12 H25 M55 12 H80"
          stroke="#D4A843"
          strokeWidth="1"
        />
        <path
          d="M40 18C40 18 34 15 34 11C34 7.5 36.5 5 40 5C43.5 5 46 7.5 46 11C46 13.5 44.5 15 42 15C39.5 15 38.5 13.5 38.5 12C38.5 10.5 39.5 10 40.5 10"
          stroke="#D4A843"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </div>
  );
}

/** Harmony icon — interlocking koru for Fleet Harmony. */
function HarmonyIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="landing-feature-icon"
      aria-hidden="true"
    >
      <path
        d="M16 32C16 32 6 27 6 18C6 11 11 6 18 6C25 6 28 11 28 16C28 20 26 22 23 22C20 22 19 20 19 18"
        stroke="#D4A843"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M32 16C32 16 42 21 42 30C42 37 37 42 30 42C23 42 20 37 20 32C20 28 22 26 25 26C28 26 29 28 29 30"
        stroke="#0A3D62"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Precision icon — concentric targeting pattern. */
function PrecisionIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="landing-feature-icon"
      aria-hidden="true"
    >
      <circle cx="24" cy="24" r="18" stroke="#D4A843" strokeWidth="1.5" />
      <circle cx="24" cy="24" r="11" stroke="#D4A843" strokeWidth="1.5" />
      <circle cx="24" cy="24" r="4" fill="#D4A843" />
      <line x1="24" y1="2" x2="24" y2="10" stroke="#D4A843" strokeWidth="1" />
      <line x1="24" y1="38" x2="24" y2="46" stroke="#D4A843" strokeWidth="1" />
      <line x1="2" y1="24" x2="10" y2="24" stroke="#D4A843" strokeWidth="1" />
      <line x1="38" y1="24" x2="46" y2="24" stroke="#D4A843" strokeWidth="1" />
    </svg>
  );
}

/** Chain icon — linked elements for Chain of Custody. */
function ChainIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="landing-feature-icon"
      aria-hidden="true"
    >
      <rect x="8" y="14" width="16" height="20" rx="8" stroke="#D4A843" strokeWidth="2" fill="none" />
      <rect x="24" y="14" width="16" height="20" rx="8" stroke="#D4A843" strokeWidth="2" fill="none" />
      <line x1="16" y1="8" x2="16" y2="14" stroke="#D4A843" strokeWidth="2" strokeLinecap="round" />
      <line x1="32" y1="34" x2="32" y2="40" stroke="#D4A843" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function LandingPage() {
  return (
    <div className="landing-page">
      <section className="landing-hero">
        <div className="landing-hero-brand">
          <KoruLogo size={56} />
          <h1>SkyHarmony</h1>
        </div>
        <p className="hero-tagline">Where Technology Meets Tradition</p>
        <p className="hero-subtitle">
          Coordinating drone fleets with the precision of a master navigator
        </p>
        <div className="landing-cta-group">
          <Link to="/dashboard" className="landing-cta">
            Enter Platform
          </Link>
          <Link to="/login" className="landing-cta-secondary">
            Sign In
          </Link>
        </div>
      </section>

      <KoruDivider />

      <section className="landing-features">
        <h2>Platform Capabilities</h2>
        <div className="landing-features-grid">
          <div className="landing-feature-card">
            <HarmonyIcon />
            <h3>Fleet Harmony</h3>
            <p>Manage 500+ drones across operators with real-time coordination and seamless fleet oversight.</p>
          </div>
          <div className="landing-feature-card">
            <PrecisionIcon />
            <h3>Precision Allocation</h3>
            <p>Smart booking and allocation engine that matches the right drone to every mission, every time.</p>
          </div>
          <div className="landing-feature-card">
            <ChainIcon />
            <h3>Chain of Custody</h3>
            <p>QR scan check-in/check-out tracking with full audit trail from dispatch to return.</p>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-footer-links">
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms of Service</Link>
          <Link to="/accessibility">Accessibility</Link>
        </div>
        <p className="landing-footer-copy">Island Pitch LLC. All rights reserved.</p>
      </footer>
    </div>
  );
}
