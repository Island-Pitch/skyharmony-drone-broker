import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiPost, setAuthToken } from '@/data/repositories/http/apiClient';

interface OnboardingData {
  role: string;
  organization: string;
  region: string;
  fleet_size: number;
}

const ROLE_OPTIONS = [
  {
    value: 'OperatorAdmin',
    label: 'Drone Fleet Owner',
    description: 'I own drones and want to make them available for shows and events',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M22 2L11 13" /><path d="M22 2L15 22L11 13L2 9L22 2Z" />
      </svg>
    ),
  },
  {
    value: 'OperatorStaff',
    label: 'Show Operator',
    description: 'I coordinate drone shows and need to book fleet from the cooperative',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4" /><path d="M8 2v4" /><path d="M3 10h18" />
      </svg>
    ),
  },
  {
    value: 'LogisticsStaff',
    label: 'Logistics Provider',
    description: 'I handle transport, check-in/check-out, and field operations',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z" /><path d="M8 2v16" /><path d="M16 6v16" />
      </svg>
    ),
  },
  {
    value: 'CentralRepoAdmin',
    label: 'Platform Administrator',
    description: 'I manage the cooperative and oversee all fleet operations',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
      </svg>
    ),
  },
];

const REGIONS = [
  'Southern California',
  'Northern California',
  'Nevada',
  'Arizona',
  'Pacific Northwest',
  'Southwest US',
  'Mountain West',
  'Midwest',
  'Southeast',
  'Northeast',
  'International',
];

export function OnboardingWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    role: '',
    organization: '',
    region: '',
    fleet_size: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const totalSteps = data.role === 'OperatorAdmin' ? 4 : 3;
  const showFleetStep = data.role === 'OperatorAdmin';

  async function handleComplete() {
    setLoading(true);
    setError('');
    try {
      const res = await apiPost<{ token: string }>('/auth/onboard', {
        role: data.role,
        organization: data.organization,
        region: data.region,
        fleet_size: data.fleet_size,
      });
      setAuthToken(res.data.token);
      setStep(showFleetStep ? 5 : 4);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="onboarding-page">
      <div className="onboarding-container">
        <div className="onboarding-header">
          <svg width="40" height="40" viewBox="0 0 48 48" fill="none" aria-hidden="true">
            <path d="M24 44C24 44 8 36 8 22C8 13.2 14.4 6 24 6C33.6 6 40 13.2 40 22C40 28 36 32 30 32C24 32 21 28 21 24C21 20 23 18 26 18C29 18 30 20 30 22" stroke="#D4A843" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          </svg>
          <h1>Welcome to SkyHarmony</h1>
          <div className="onboarding-progress">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div key={i} className={`progress-dot ${i + 1 <= step ? 'active' : ''} ${i + 1 === step ? 'current' : ''}`} />
            ))}
          </div>
        </div>

        {/* Step 1: Role Selection */}
        {step === 1 && (
          <div className="onboarding-step">
            <h2>What best describes you?</h2>
            <p className="onboarding-hint">This determines your default permissions and dashboard view.</p>
            <div className="role-grid">
              {ROLE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`role-card ${data.role === opt.value ? 'selected' : ''}`}
                  onClick={() => setData({ ...data, role: opt.value })}
                >
                  <div className="role-icon">{opt.icon}</div>
                  <strong>{opt.label}</strong>
                  <p>{opt.description}</p>
                </button>
              ))}
            </div>
            <button
              className="btn-primary onboarding-next"
              disabled={!data.role}
              onClick={() => setStep(2)}
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 2: Organization */}
        {step === 2 && (
          <div className="onboarding-step">
            <h2>Your Organization</h2>
            <p className="onboarding-hint">Tell us about your company so we can set up your workspace.</p>
            <form className="onboarding-form" onSubmit={(e) => { e.preventDefault(); setStep(showFleetStep ? 3 : 3); }}>
              <label>
                <span>Company / Organization Name</span>
                <input
                  type="text"
                  value={data.organization}
                  onChange={(e) => setData({ ...data, organization: e.target.value })}
                  placeholder="e.g. NightBrite Drones"
                  required
                />
              </label>
              <label>
                <span>Primary Region</span>
                <select
                  value={data.region}
                  onChange={(e) => setData({ ...data, region: e.target.value })}
                  required
                >
                  <option value="">Select your region...</option>
                  {REGIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </label>
              <div className="onboarding-actions">
                <button type="button" className="btn-secondary" onClick={() => setStep(1)}>Back</button>
                <button type="submit" className="btn-primary" disabled={!data.organization || !data.region}>Continue</button>
              </div>
            </form>
          </div>
        )}

        {/* Step 3: Fleet (fleet owners only) or Confirm */}
        {step === 3 && showFleetStep && (
          <div className="onboarding-step">
            <h2>Your Fleet</h2>
            <p className="onboarding-hint">How many drones does your organization currently operate?</p>
            <form className="onboarding-form" onSubmit={(e) => { e.preventDefault(); handleComplete(); }}>
              <label>
                <span>Approximate Fleet Size (drones)</span>
                <input
                  type="number"
                  min="0"
                  value={data.fleet_size || ''}
                  onChange={(e) => setData({ ...data, fleet_size: parseInt(e.target.value) || 0 })}
                  placeholder="e.g. 150"
                />
              </label>
              <div className="fleet-size-hints">
                {[50, 100, 200, 500].map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`fleet-hint-btn ${data.fleet_size === n ? 'active' : ''}`}
                    onClick={() => setData({ ...data, fleet_size: n })}
                  >
                    {n}
                  </button>
                ))}
              </div>
              {error && <p className="login-error">{error}</p>}
              <div className="onboarding-actions">
                <button type="button" className="btn-secondary" onClick={() => setStep(2)}>Back</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Setting up...' : 'Complete Setup'}
                </button>
              </div>
            </form>
          </div>
        )}

        {step === 3 && !showFleetStep && (
          <div className="onboarding-step">
            <h2>Ready to Go</h2>
            <div className="onboarding-summary">
              <div className="summary-row"><span>Role</span><strong>{ROLE_OPTIONS.find((o) => o.value === data.role)?.label}</strong></div>
              <div className="summary-row"><span>Organization</span><strong>{data.organization}</strong></div>
              <div className="summary-row"><span>Region</span><strong>{data.region}</strong></div>
            </div>
            {error && <p className="login-error">{error}</p>}
            <div className="onboarding-actions">
              <button type="button" className="btn-secondary" onClick={() => setStep(2)}>Back</button>
              <button className="btn-primary" onClick={handleComplete} disabled={loading}>
                {loading ? 'Setting up...' : 'Complete Setup'}
              </button>
            </div>
          </div>
        )}

        {/* Final: Welcome */}
        {(step === 4 || step === 5) && (
          <div className="onboarding-step onboarding-welcome">
            <div className="welcome-icon">
              <svg width="64" height="64" viewBox="0 0 48 48" fill="none" aria-hidden="true">
                <path d="M24 44C24 44 8 36 8 22C8 13.2 14.4 6 24 6C33.6 6 40 13.2 40 22C40 28 36 32 30 32C24 32 21 28 21 24C21 20 23 18 26 18C29 18 30 20 30 22" stroke="#D4A843" strokeWidth="2" strokeLinecap="round" fill="none" />
                <circle cx="24" cy="22" r="3" fill="#2ECC71" />
              </svg>
            </div>
            <h2>Kia ora! You're all set.</h2>
            <p className="onboarding-hint">
              Welcome to the SkyHarmony cooperative, {data.organization}.
              Your {data.region} workspace is ready.
            </p>
            <button className="btn-primary onboarding-next" onClick={() => navigate('/dashboard')}>
              Enter Platform
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
