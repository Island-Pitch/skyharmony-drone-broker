import { Link } from 'react-router-dom';

function KoruLogo({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="M24 44C24 44 8 36 8 22C8 13.2 14.4 6 24 6C33.6 6 40 13.2 40 22C40 28 36 32 30 32C24 32 21 28 21 24C21 20 23 18 26 18C29 18 30 20 30 22" stroke="#D4A843" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function KoruDivider() {
  return (
    <div className="landing-divider">
      <svg width="80" height="24" viewBox="0 0 80 24" fill="none" aria-hidden="true">
        <path d="M0 12 H25 M55 12 H80" stroke="#D4A843" strokeWidth="1" />
        <path d="M40 18C40 18 34 15 34 11C34 7.5 36.5 5 40 5C43.5 5 46 7.5 46 11C46 13.5 44.5 15 42 15C39.5 15 38.5 13.5 38.5 12C38.5 10.5 39.5 10 40.5 10" stroke="#D4A843" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      </svg>
    </div>
  );
}

function DroneFormationIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="landing-feature-icon" aria-hidden="true">
      <circle cx="24" cy="12" r="3" fill="#D4A843" /><circle cx="12" cy="24" r="3" fill="#D4A843" />
      <circle cx="36" cy="24" r="3" fill="#D4A843" /><circle cx="24" cy="36" r="3" fill="#D4A843" />
      <circle cx="16" cy="16" r="2" fill="#0A3D62" /><circle cx="32" cy="16" r="2" fill="#0A3D62" />
      <circle cx="16" cy="32" r="2" fill="#0A3D62" /><circle cx="32" cy="32" r="2" fill="#0A3D62" />
      <path d="M24 12L12 24M24 12L36 24M12 24L24 36M36 24L24 36" stroke="#D4A843" strokeWidth="0.5" opacity="0.4" />
    </svg>
  );
}

function CooperativeIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="landing-feature-icon" aria-hidden="true">
      <path d="M16 32C16 32 6 27 6 18C6 11 11 6 18 6C25 6 28 11 28 16C28 20 26 22 23 22C20 22 19 20 19 18" stroke="#D4A843" strokeWidth="2" strokeLinecap="round" />
      <path d="M32 16C32 16 42 21 42 30C42 37 37 42 30 42C23 42 20 37 20 32C20 28 22 26 25 26C28 26 29 28 29 30" stroke="#0A3D62" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function SafetyIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="landing-feature-icon" aria-hidden="true">
      <path d="M24 4L6 12V22C6 33.1 13.7 43.2 24 46C34.3 43.2 42 33.1 42 22V12L24 4Z" stroke="#D4A843" strokeWidth="2" fill="none" />
      <path d="M17 24L22 29L31 20" stroke="#2ECC71" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BookingIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="landing-feature-icon" aria-hidden="true">
      <rect x="6" y="10" width="36" height="32" rx="3" stroke="#D4A843" strokeWidth="2" fill="none" />
      <path d="M6 20H42" stroke="#D4A843" strokeWidth="2" /><path d="M16 6V14" stroke="#D4A843" strokeWidth="2" strokeLinecap="round" />
      <path d="M32 6V14" stroke="#D4A843" strokeWidth="2" strokeLinecap="round" />
      <circle cx="16" cy="28" r="2" fill="#D4A843" /><circle cx="24" cy="28" r="2" fill="#D4A843" />
      <circle cx="32" cy="28" r="2" fill="#D4A843" /><circle cx="16" cy="36" r="2" fill="#0A3D62" />
    </svg>
  );
}

function CustodyIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="landing-feature-icon" aria-hidden="true">
      <rect x="8" y="14" width="16" height="20" rx="8" stroke="#D4A843" strokeWidth="2" fill="none" />
      <rect x="24" y="14" width="16" height="20" rx="8" stroke="#D4A843" strokeWidth="2" fill="none" />
      <path d="M16 8V14M32 34V40" stroke="#D4A843" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function BillingIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="landing-feature-icon" aria-hidden="true">
      <path d="M24 6V42" stroke="#D4A843" strokeWidth="2" strokeLinecap="round" />
      <path d="M32 14H20C16.7 14 14 16.7 14 20C14 23.3 16.7 26 20 26H28C31.3 26 34 28.7 34 32C34 35.3 31.3 38 28 38H14" stroke="#D4A843" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function LandingPage() {
  return (
    <div className="landing-page">
      {/* Hero */}
      <section className="landing-hero">
        <div className="landing-hero-brand">
          <KoruLogo size={64} />
          <h1>SkyHarmony</h1>
        </div>
        <p className="hero-tagline">The Sky is No Longer the Limit</p>
        <p className="hero-subtitle">
          The cooperative platform that connects drone show operators,
          fleet owners, and logistics teams — so every light in the sky
          finds its place in the formation.
        </p>
        <div className="landing-cta-group">
          <Link to="/login" className="landing-cta">
            Get Started
          </Link>
          <Link to="/dashboard" className="landing-cta-secondary">
            View Demo
          </Link>
        </div>
      </section>

      <KoruDivider />

      {/* Mission Statement */}
      <section className="landing-mission">
        <h2>Whakarite — To Coordinate, To Bring Into Harmony</h2>
        <p>
          Born from the drone show industry's need for cooperation over competition,
          SkyHarmony brings fleet owners together into a single cooperative — pooling
          thousands of drones across operators to deliver shows no single company
          could produce alone. Like the Maori concept of <em>kotahitanga</em> (unity),
          we believe the fleet is stronger when it flies together.
        </p>
      </section>

      <KoruDivider />

      {/* Features */}
      <section className="landing-features">
        <h2>Built for the Way You Work</h2>
        <div className="landing-features-grid">
          <div className="landing-feature-card">
            <DroneFormationIcon />
            <h3>Fleet at a Glance</h3>
            <p>See every drone across the cooperative — availability, maintenance status, flight hours — in real time. Know what's ready before you book.</p>
          </div>
          <div className="landing-feature-card">
            <BookingIcon />
            <h3>Book Shows, Not Spreadsheets</h3>
            <p>Request 50 or 500 drones for your next show. The allocation engine matches availability to your dates, handles conflicts, and suggests alternatives.</p>
          </div>
          <div className="landing-feature-card">
            <CustodyIcon />
            <h3>Chain of Custody</h3>
            <p>Scan drones in and out at every handoff. Know exactly who has what, when it left, and when it came back — with a full audit trail.</p>
          </div>
          <div className="landing-feature-card">
            <CooperativeIcon />
            <h3>Cooperative Economics</h3>
            <p>Transparent billing — allocation fees, standby fees, insurance pool — calculated from real bookings. Every operator sees exactly what they earn and owe.</p>
          </div>
          <div className="landing-feature-card">
            <SafetyIcon />
            <h3>Safety First, Always</h3>
            <p>Maintenance alerts flag drones before they hit limits. Critical incidents auto-ground equipment. Every status change is logged, audited, and traceable.</p>
          </div>
          <div className="landing-feature-card">
            <BillingIcon />
            <h3>Revenue You Can Trust</h3>
            <p>Real revenue calculated from real bookings — not estimates. Per-operator splits, insurance contributions, and pending invoices, all from the same source of truth.</p>
          </div>
        </div>
      </section>

      <KoruDivider />

      {/* Who It's For */}
      <section className="landing-personas">
        <h2>Who Flies With Us</h2>
        <div className="landing-personas-grid">
          <div className="landing-persona-card">
            <h3>Drone Fleet Owners</h3>
            <p>You built the fleet. Now make it work harder. Pool your drones into the cooperative, earn allocation revenue when they fly, and standby fees when they're on reserve. See your fleet's utilization, maintenance health, and earnings in one place.</p>
          </div>
          <div className="landing-persona-card">
            <h3>Show Operators</h3>
            <p>You create the magic. Book the drones you need for your next show — from 50-drone intimate displays to 2,500-drone stadium spectacles. Submit requests, track approvals, and manage your upcoming calendar without chasing spreadsheets.</p>
          </div>
          <div className="landing-persona-card">
            <h3>Logistics Teams</h3>
            <p>You make it happen on the ground. Scan drones in and out at every venue. Track manifests, reconcile equipment, and report issues — all from your phone. Every check-in and check-out creates a custody record that protects everyone.</p>
          </div>
        </div>
      </section>

      <KoruDivider />

      {/* Trust / Values */}
      <section className="landing-values">
        <h2>Manaakitanga — The Way We Work</h2>
        <div className="landing-values-grid">
          <div className="landing-value">
            <strong>Kaitiakitanga</strong>
            <span>Guardianship</span>
            <p>Your fleet data stays on infrastructure you control. Zero outbound calls, no cloud vendor lock-in. Self-hosted on your own hardware or sovereign cloud.</p>
          </div>
          <div className="landing-value">
            <strong>Kotahitanga</strong>
            <span>Unity</span>
            <p>The cooperative model means every operator contributes and benefits. Fair allocation, transparent revenue, shared insurance protection.</p>
          </div>
          <div className="landing-value">
            <strong>Whanaungatanga</strong>
            <span>Kinship</span>
            <p>Built by operators, for operators. Every feature exists because someone in the field needed it. Open governance, shared roadmap, collective ownership.</p>
          </div>
        </div>
      </section>

      <KoruDivider />

      {/* CTA */}
      <section className="landing-bottom-cta">
        <KoruLogo size={48} />
        <h2>Ready to Fly Together?</h2>
        <p>Join the cooperative and see what your fleet can do when it's part of something bigger.</p>
        <div className="landing-cta-group">
          <Link to="/login" className="landing-cta">
            Create Your Account
          </Link>
          <a href="https://skyharmony.us" className="landing-cta-secondary" target="_blank" rel="noopener noreferrer">
            Visit SkyHarmony.us
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-links">
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms of Service</Link>
          <Link to="/accessibility">Accessibility</Link>
          <Link to="/data-sovereignty">Data Sovereignty</Link>
          <a href="https://skyharmony.us" target="_blank" rel="noopener noreferrer">SkyHarmony.us</a>
        </div>
        <p className="landing-footer-copy">Sky Harmony Drone Shows &middot; Long Beach, California &middot; Sky Harmony LLC</p>
        <p className="landing-footer-copy" style={{ marginTop: '0.25rem' }}>
          Data governance aligned with <a href="https://www.temanararaunga.maori.nz/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-te-ra)', textDecoration: 'none' }}>Te Mana Raraunga</a> &middot; CARE Principles
        </p>
      </footer>
    </div>
  );
}
