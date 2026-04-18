import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, signup } from '@/auth/authService';

export function LoginPage() {
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignup) {
        await signup(email, password, name);
        navigate('/onboarding');
      } else {
        const result = await login(email, password);
        // If user hasn't completed onboarding, redirect there
        if (result.user && result.user.onboarded !== 'true') {
          navigate('/onboarding');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
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
          <p className="login-subtitle">{isSignup ? 'Create your account' : 'Sign in to continue'}</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {isSignup && (
            <label className="login-field">
              <span>Full Name</span>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Jonathan de Armas" />
            </label>
          )}
          <label className="login-field">
            <span>Email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="admin@skyharmony.dev" />
          </label>
          <label className="login-field">
            <span>Password</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="Enter password" />
          </label>

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="btn-primary login-btn" disabled={loading}>
            {loading ? 'Please wait...' : isSignup ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <p className="login-toggle">
          {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button type="button" className="login-link" onClick={() => { setIsSignup(!isSignup); setError(''); }}>
            {isSignup ? 'Sign in' : 'Sign up'}
          </button>
        </p>

        <div className="login-demo-hint">
          <p>Demo credentials: <code>admin@skyharmony.dev</code> / <code>admin123</code></p>
        </div>
      </div>
    </div>
  );
}
