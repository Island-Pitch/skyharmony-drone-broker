import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { resetPassword } from '@/auth/authService';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token!, password);
      setSuccess(true);
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
          <p className="login-subtitle">Set a new password</p>
        </div>

        {!token ? (
          <>
            <p className="login-error">No reset token found. Please request a new reset link.</p>
            <p className="login-toggle">
              <Link to="/forgot-password" className="login-link">Request Reset Link</Link>
            </p>
          </>
        ) : success ? (
          <>
            <p style={{ textAlign: 'center', lineHeight: 1.6 }}>
              Your password has been reset successfully. Welcome back to the formation.
            </p>
            <p className="login-toggle">
              <Link to="/login" className="login-link">Sign In</Link>
            </p>
          </>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="login-form">
              <label className="login-field">
                <span>New Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="At least 6 characters"
                />
              </label>
              <label className="login-field">
                <span>Confirm Password</span>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Re-enter password"
                />
              </label>

              {error && <p className="login-error">{error}</p>}

              <button type="submit" className="btn-primary login-btn" disabled={loading}>
                {loading ? 'Please wait...' : 'Reset Password'}
              </button>
            </form>

            <p className="login-toggle">
              <Link to="/login" className="login-link">Back to Sign In</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
