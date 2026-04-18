import { useState } from 'react';
import { useTerms, type CreateTermsPayload } from '@/hooks/useTerms';
import { useAuth } from '@/auth/useAuth';
import { Role } from '@/auth/roles';

function formatCurrency(value: string | number): string {
  return `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatPct(value: string | number): string {
  return `${Number(value)}%`;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatTimestamp(ts: string): string {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function TermsConfigPage() {
  const { current, history, loading, error, createTerms } = useTerms();
  const { role } = useAuth();
  const isAdmin = role === Role.CentralRepoAdmin;

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CreateTermsPayload>({
    brokerage_pct: 0,
    allocation_fee_per_drone: 0,
    standby_fee_per_drone: 0,
    insurance_pool_pct: 0,
    net_payment_days: 0,
    damage_policy: '',
    effective_date: '',
  });

  function startEditing() {
    if (!current) return;
    setForm({
      brokerage_pct: Number(current.brokerage_pct),
      allocation_fee_per_drone: Number(current.allocation_fee_per_drone),
      standby_fee_per_drone: Number(current.standby_fee_per_drone),
      insurance_pool_pct: Number(current.insurance_pool_pct),
      net_payment_days: current.net_payment_days,
      damage_policy: current.damage_policy ?? '',
      effective_date: current.effective_date,
    });
    setEditing(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await createTerms(form);
      setEditing(false);
    } catch {
      // error shown via hook
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="page">
        <h2 style={{ fontFamily: 'var(--font-display)' }}>Cooperative Terms</h2>
        <p>Loading terms...</p>
      </div>
    );
  }

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', margin: 0 }}>Cooperative Terms</h2>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.3rem 1rem',
            borderRadius: '999px',
            border: '1px solid var(--color-te-ra)',
            color: 'var(--color-te-ra)',
            fontSize: '0.8rem',
            fontWeight: 600,
            letterSpacing: '0.02em',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          Uniform Terms — applied equally to all partners
        </span>
      </div>

      {error && (
        <div style={{ padding: '0.75rem 1rem', marginBottom: '1rem', borderRadius: 'var(--radius)', background: 'rgba(231, 76, 60, 0.15)', border: '1px solid rgba(231, 76, 60, 0.3)', color: '#E74C3C' }}>
          {error}
        </div>
      )}

      {current && !editing && (
        <>
          <div className="stats-grid" style={{ marginBottom: '2rem' }}>
            <div className="stat-card">
              <span className="stat-value" style={{ fontFamily: 'var(--font-display)' }}>
                {formatPct(current.brokerage_pct)}
              </span>
              <span className="stat-label">Brokerage Fee</span>
            </div>
            <div className="stat-card">
              <span className="stat-value" style={{ fontFamily: 'var(--font-display)' }}>
                {formatCurrency(current.allocation_fee_per_drone)}
              </span>
              <span className="stat-label">Allocation Fee / Drone</span>
            </div>
            <div className="stat-card">
              <span className="stat-value" style={{ fontFamily: 'var(--font-display)' }}>
                {formatCurrency(current.standby_fee_per_drone)}
              </span>
              <span className="stat-label">Standby Fee / Drone</span>
            </div>
            <div className="stat-card">
              <span className="stat-value" style={{ fontFamily: 'var(--font-display)' }}>
                {formatPct(current.insurance_pool_pct)}
              </span>
              <span className="stat-label">Insurance Pool</span>
            </div>
            <div className="stat-card">
              <span className="stat-value" style={{ fontFamily: 'var(--font-display)' }}>
                {current.net_payment_days} days
              </span>
              <span className="stat-label">Net Payment Terms</span>
            </div>
            <div className="stat-card">
              <span className="stat-value" style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>
                v{current.version}
              </span>
              <span className="stat-label">Current Version</span>
            </div>
          </div>

          {current.damage_policy && (
            <div className="dashboard-widget" style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '0.75rem' }}>Damage Policy</h3>
              <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.7 }}>{current.damage_policy}</p>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              Effective: {formatDate(current.effective_date)}
            </span>
            {isAdmin && (
              <button
                onClick={startEditing}
                style={{
                  padding: '0.5rem 1.5rem',
                  borderRadius: '999px',
                  border: '1px solid var(--color-te-ra)',
                  background: 'transparent',
                  color: 'var(--color-te-ra)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  transition: 'all 0.2s',
                }}
              >
                Edit Terms
              </button>
            )}
          </div>
        </>
      )}

      {editing && (
        <div className="dashboard-widget" style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '1rem' }}>Update Cooperative Terms</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Brokerage %</span>
              <input
                type="number"
                step="0.01"
                value={form.brokerage_pct}
                onChange={(e) => setForm({ ...form, brokerage_pct: Number(e.target.value) })}
                style={inputStyle}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Allocation Fee ($)</span>
              <input
                type="number"
                step="0.01"
                value={form.allocation_fee_per_drone}
                onChange={(e) => setForm({ ...form, allocation_fee_per_drone: Number(e.target.value) })}
                style={inputStyle}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Standby Fee ($)</span>
              <input
                type="number"
                step="0.01"
                value={form.standby_fee_per_drone}
                onChange={(e) => setForm({ ...form, standby_fee_per_drone: Number(e.target.value) })}
                style={inputStyle}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Insurance Pool %</span>
              <input
                type="number"
                step="0.01"
                value={form.insurance_pool_pct}
                onChange={(e) => setForm({ ...form, insurance_pool_pct: Number(e.target.value) })}
                style={inputStyle}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Net Payment Days</span>
              <input
                type="number"
                value={form.net_payment_days}
                onChange={(e) => setForm({ ...form, net_payment_days: Number(e.target.value) })}
                style={inputStyle}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Effective Date</span>
              <input
                type="date"
                value={form.effective_date}
                onChange={(e) => setForm({ ...form, effective_date: e.target.value })}
                style={inputStyle}
              />
            </label>
          </div>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Damage Policy</span>
            <textarea
              value={form.damage_policy ?? ''}
              onChange={(e) => setForm({ ...form, damage_policy: e.target.value })}
              rows={4}
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'var(--font-body)' }}
            />
          </label>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: '0.5rem 1.5rem',
                borderRadius: '999px',
                border: 'none',
                background: 'var(--color-te-ra)',
                color: '#000',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                fontSize: '0.85rem',
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? 'Saving...' : 'Save New Version'}
            </button>
            <button
              onClick={() => setEditing(false)}
              disabled={saving}
              style={{
                padding: '0.5rem 1.5rem',
                borderRadius: '999px',
                border: '1px solid var(--color-border)',
                background: 'transparent',
                color: 'var(--color-text-muted)',
                cursor: 'pointer',
                fontSize: '0.85rem',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Version History Timeline */}
      {history.length > 0 && (
        <div className="dashboard-widget">
          <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '1.5rem' }}>Version History</h3>
          <div style={{ position: 'relative', paddingLeft: '2rem' }}>
            {/* Vertical connecting line */}
            <div
              style={{
                position: 'absolute',
                left: '7px',
                top: '8px',
                bottom: '8px',
                width: '2px',
                background: 'linear-gradient(to bottom, var(--color-te-ra), rgba(212, 168, 67, 0.15))',
              }}
            />
            {history.map((entry, idx) => (
              <div
                key={entry.id}
                style={{
                  position: 'relative',
                  paddingBottom: idx === history.length - 1 ? 0 : '1.5rem',
                }}
              >
                {/* Gold dot */}
                <div
                  style={{
                    position: 'absolute',
                    left: '-2rem',
                    top: '4px',
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: idx === 0 ? 'var(--color-te-ra)' : 'rgba(212, 168, 67, 0.3)',
                    border: '3px solid var(--color-bg)',
                    boxShadow: idx === 0 ? '0 0 8px rgba(212, 168, 67, 0.4)' : 'none',
                  }}
                />
                <div
                  style={{
                    background: idx === 0 ? 'rgba(212, 168, 67, 0.06)' : 'transparent',
                    border: idx === 0 ? '1px solid rgba(212, 168, 67, 0.12)' : '1px solid var(--color-border)',
                    borderRadius: 'var(--radius)',
                    padding: '0.75rem 1rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 600 }}>
                      Version {entry.version}
                      {idx === 0 && (
                        <span style={{ marginLeft: '0.5rem', fontSize: '0.7rem', color: 'var(--color-te-ra)', background: 'rgba(212, 168, 67, 0.1)', padding: '0.15rem 0.5rem', borderRadius: '999px' }}>
                          CURRENT
                        </span>
                      )}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      {formatTimestamp(entry.created_at)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                    <span>Brokerage {formatPct(entry.brokerage_pct)}</span>
                    <span>Allocation {formatCurrency(entry.allocation_fee_per_drone)}</span>
                    <span>Standby {formatCurrency(entry.standby_fee_per_drone)}</span>
                    <span>Insurance {formatPct(entry.insurance_pool_pct)}</span>
                    <span>Net-{entry.net_payment_days}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.3rem' }}>
                    Effective: {formatDate(entry.effective_date)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '0.5rem 0.75rem',
  borderRadius: '8px',
  border: '1px solid var(--color-border)',
  background: 'rgba(10, 61, 98, 0.2)',
  color: 'var(--color-text)',
  fontSize: '0.9rem',
  outline: 'none',
  transition: 'border-color 0.2s',
};
