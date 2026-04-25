import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '@/auth/authService';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [resetUrl, setResetUrl] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await forgotPassword(email);
      setSubmitted(true);
      if (result.resetUrl) setResetUrl(result.resetUrl);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
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
          <p className="login-subtitle">Reset your password</p>
        </div>

        {submitted ? (
          <>
            <p style={{ textAlign: 'center', lineHeight: 1.6 }}>
              If an account with that email exists, a reset link has been sent. Check your inbox.
            </p>

            <div className="login-demo-hint">
              <p>Can't find it? Check your spam or junk folder — we're a young cooperative and some email providers are still learning to trust us. Marking us "not spam" helps the whole formation fly together.</p>
            </div>

            {resetUrl && (
              <div className="login-demo-hint">
                <p>Dev mode — <a href={resetUrl} style={{ color: '#D4A843' }}>click here to reset</a></p>
              </div>
            )}

            <p className="login-toggle">
              <Link to="/login" className="login-link">Back to Sign In</Link>
            </p>
          </>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="login-form">
              <label className="login-field">
                <span>Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                />
              </label>

              {error && <p className="login-error">{error}</p>}

              <button type="submit" className="btn-primary login-btn" disabled={loading}>
                {loading ? 'Please wait...' : 'Send Reset Link'}
              </button>
            </form>

            <p className="login-toggle">
              Remember your password?{' '}
              <Link to="/login" className="login-link">Sign In</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
