import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '@/auth/authService';
import posthog from '@/lib/posthog';

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password);
      posthog.identify(result.user.id, {
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
      });
      if (result.user && result.user.onboarded !== 'true') {
        navigate('/onboarding');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Authentication failed';
      setError(message);
      posthog.capture('login_failed', { error: message });
      posthog.captureException(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
            <path d="M24 44C24 44 8 36 8 22C8 13.2 14.4 6 24 6C33.6 6 40 13.2 40 22C40 28 36 32 30 32C24 32 21 28 21 24C21 20 23 18 26 18C29 18 30 20 30 22" stroke="#D4A843" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          </svg>
          <h1>SkyHarmony</h1>
          <p className="login-subtitle">Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <label className="login-field">
            <span>Email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="admin@skyharmony.dev" />
          </label>
          <label className="login-field">
            <span>Password</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="Enter password" />
          </label>

          <Link to="/forgot-password" className="login-link" style={{ alignSelf: 'flex-end', fontSize: '0.8rem' }}>
            Forgot your password?
          </Link>

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="btn-primary login-btn" disabled={loading}>
            {loading ? 'Please wait...' : 'Sign In'}
          </button>
        </form>

        <p className="login-toggle">
          Don't have an account?{' '}
          <Link to="/onboarding" className="login-link">Create one</Link>
        </p>

        <div className="login-demo-hint">
          <p>Demo credentials: <code>admin@skyharmony.dev</code> / <code>admin123</code></p>
        </div>
      </div>
    </div>
  );
}
