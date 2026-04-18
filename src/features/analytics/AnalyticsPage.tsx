import { useState } from 'react';
import {
  useAnalytics,
  type Anomaly,
  type ComputeBaselinesResult,
  type DetectAnomaliesResult,
} from '@/hooks/useAnalytics';

/** SHD-11: Predictive maintenance analytics — baselines and anomaly detection. */
export function AnalyticsPage() {
  const {
    anomalies,
    anomaliesMeta,
    baselinesData,
    loadingAnomalies,
    loadingBaselines,
    computeBaselines,
    detectAnomalies,
    reviewAnomaly,
  } = useAnalytics();

  const [computing, setComputing] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [computeResult, setComputeResult] = useState<ComputeBaselinesResult | null>(null);
  const [detectResult, setDetectResult] = useState<DetectAnomaliesResult | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const pendingCount =
    anomaliesMeta?.status_counts.pending ??
    anomalies.filter((a) => a.status === 'pending').length;
  const totalBaselines = baselinesData?.total_baselines ?? 0;
  const coveragePct = baselinesData?.fleet_coverage_pct ?? 0;

  async function handleComputeBaselines() {
    setComputing(true);
    setActionError(null);
    setComputeResult(null);
    try {
      const result = await computeBaselines();
      setComputeResult(result);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Baseline computation failed');
    } finally {
      setComputing(false);
    }
  }

  async function handleDetectAnomalies() {
    setDetecting(true);
    setActionError(null);
    setDetectResult(null);
    try {
      const result = await detectAnomalies();
      setDetectResult(result);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Anomaly detection failed');
    } finally {
      setDetecting(false);
    }
  }

  async function handleReview(id: string, status: 'accepted' | 'dismissed') {
    try {
      await reviewAnomaly(id, status);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Review failed');
    }
  }

  const filteredAnomalies = statusFilter
    ? anomalies.filter((a) => a.status === statusFilter)
    : anomalies;

  return (
    <div className="page">
      <h2>Predictive Analytics</h2>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
        Baseline computation and anomaly detection for fleet health monitoring
      </p>

      {/* Stats Cards */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        <StatCard
          label="Pending Anomalies"
          value={loadingAnomalies ? '...' : String(pendingCount)}
          accent={pendingCount > 0 ? 'var(--color-danger, #ef4444)' : 'var(--color-success, #22c55e)'}
        />
        <StatCard
          label="Baselines Computed"
          value={loadingBaselines ? '...' : String(totalBaselines)}
        />
        <CoverageCard label="Fleet Coverage" value={coveragePct} loading={loadingBaselines} />
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button className="btn-primary" onClick={handleComputeBaselines} disabled={computing}>
          {computing ? 'Computing...' : 'Compute Baselines'}
        </button>
        <button className="btn-primary" onClick={handleDetectAnomalies} disabled={detecting}>
          {detecting ? 'Detecting...' : 'Detect Anomalies'}
        </button>
      </div>

      {/* Action Results */}
      {computeResult && (
        <div style={{ ...resultBannerStyle, borderLeftColor: 'var(--color-success, #22c55e)' }}>
          Baselines computed for {computeResult.baselines_computed} asset(s). Fleet coverage: {computeResult.fleet_coverage_pct}%
        </div>
      )}
      {detectResult && (
        <div style={{ ...resultBannerStyle, borderLeftColor: detectResult.anomalies_created > 0 ? 'var(--color-warning, #f59e0b)' : 'var(--color-success, #22c55e)' }}>
          Detection complete. {detectResult.anomalies_created} anomaly(ies) flagged.
        </div>
      )}
      {actionError && (
        <div style={{ ...resultBannerStyle, borderLeftColor: 'var(--color-danger, #ef4444)', color: 'var(--color-danger, #ef4444)' }}>
          {actionError}
        </div>
      )}

      {/* Anomaly Queue */}
      <div style={{ marginTop: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0 }}>Anomaly Queue</h3>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={filterSelectStyle}>
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </div>

        {loadingAnomalies ? (
          <p>Loading anomalies...</p>
        ) : filteredAnomalies.length === 0 ? (
          <p style={{ color: 'var(--color-text-secondary)' }}>No anomalies found.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Severity</th>
                  <th>Asset</th>
                  <th>Type</th>
                  <th>Field</th>
                  <th>Expected vs Actual</th>
                  <th>Deviation</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAnomalies.map((anomaly) => (
                  <AnomalyRow key={anomaly.id} anomaly={anomaly} onReview={handleReview} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Anomaly Row ---------- */

function AnomalyRow({ anomaly, onReview }: { anomaly: Anomaly; onReview: (id: string, status: 'accepted' | 'dismissed') => void }) {
  const sigma = Number(anomaly.sigma_distance ?? 0);
  const severityColor = sigma >= 3 ? '#ef4444' : sigma >= 2 ? '#f59e0b' : '#22c55e';
  const severityLabel = sigma >= 3 ? '3+' : sigma >= 2 ? '2+' : '<2';
  const expected = Number(anomaly.expected_value ?? 0);
  const actual = Number(anomaly.actual_value ?? 0);

  return (
    <tr style={{ borderLeft: `3px solid ${severityColor}` }}>
      <td>
        <span style={{ ...severityBadgeStyle, background: severityColor }}>{severityLabel} sigma</span>
      </td>
      <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
        {anomaly.asset_serial ?? (anomaly.asset_id ? anomaly.asset_id.slice(0, 8) + '...' : 'N/A')}
      </td>
      <td><span style={typeBadgeStyle}>{formatAnomalyType(anomaly.anomaly_type)}</span></td>
      <td>{formatFieldName(anomaly.field)}</td>
      <td>
        <span style={{ color: 'var(--color-text-secondary)' }}>{expected.toFixed(1)}</span>
        {' / '}
        <span style={{ fontWeight: 600 }}>{actual.toFixed(1)}</span>
      </td>
      <td><SigmaBar sigma={sigma} /></td>
      <td>
        <span style={{
          ...pillStyle,
          background: anomaly.status === 'pending' ? '#fef3c7' : anomaly.status === 'accepted' ? '#dcfce7' : '#f3f4f6',
          color: anomaly.status === 'pending' ? '#92400e' : anomaly.status === 'accepted' ? '#166534' : '#374151',
        }}>
          {anomaly.status}
        </span>
      </td>
      <td>
        {anomaly.status === 'pending' && (
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <button onClick={() => onReview(anomaly.id, 'accepted')} style={{ ...actionPillStyle, background: '#dcfce7', color: '#166534' }}>Accept</button>
            <button onClick={() => onReview(anomaly.id, 'dismissed')} style={{ ...actionPillStyle, background: '#f3f4f6', color: '#374151' }}>Dismiss</button>
          </div>
        )}
      </td>
    </tr>
  );
}

/* ---------- Sigma Bar (CSS-only sparkline) ---------- */

function SigmaBar({ sigma }: { sigma: number }) {
  const maxSigma = 4;
  const clampedSigma = Math.min(sigma, maxSigma);
  const pct = (clampedSigma / maxSigma) * 100;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '120px' }}>
      <div style={{
        flex: 1, height: '8px', borderRadius: '4px', position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(to right, #22c55e 0%, #22c55e 25%, #f59e0b 25%, #f59e0b 50%, #ef4444 50%, #ef4444 100%)',
      }}>
        <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: `${100 - pct}%`, background: 'var(--color-surface, #fff)', opacity: 0.85 }} />
        <div style={{ position: 'absolute', left: `${pct}%`, top: '-2px', width: '3px', height: '12px', background: '#1e293b', borderRadius: '1px', transform: 'translateX(-1.5px)' }} />
      </div>
      <span style={{ fontSize: '0.75rem', fontWeight: 600, minWidth: '2.5rem', color: sigma >= 3 ? '#ef4444' : sigma >= 2 ? '#f59e0b' : '#22c55e' }}>
        {sigma.toFixed(1)} sigma
      </span>
    </div>
  );
}

/* ---------- Coverage Card (CSS-only circular progress) ---------- */

function CoverageCard({ label, value, loading }: { label: string; value: number; loading: boolean }) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const color = value >= 80 ? '#22c55e' : value >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div style={{ flex: '1 1 180px', background: 'var(--color-surface)', border: '1px solid var(--color-border, #e5e7eb)', borderRadius: '8px', padding: '1rem 1.25rem', minWidth: '180px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <svg width="64" height="64" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={radius} fill="none" stroke="var(--color-border, #e5e7eb)" strokeWidth="5" />
        <circle cx="32" cy="32" r={radius} fill="none" stroke={loading ? 'var(--color-border, #e5e7eb)' : color} strokeWidth="5" strokeDasharray={circumference} strokeDashoffset={loading ? circumference : offset} strokeLinecap="round" transform="rotate(-90 32 32)" style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
        <text x="32" y="36" textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--color-text)">{loading ? '...' : `${value}%`}</text>
      </svg>
      <div>
        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{label}</div>
        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text)' }}>{loading ? '...' : `${value}% of fleet`}</div>
      </div>
    </div>
  );
}

/* ---------- Stat Card ---------- */

function StatCard({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div style={{ flex: '1 1 140px', background: 'var(--color-surface)', border: '1px solid var(--color-border, #e5e7eb)', borderRadius: '8px', padding: '1rem 1.25rem', minWidth: '140px' }}>
      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>{label}</div>
      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: accent ?? 'var(--color-text)' }}>{value}</div>
    </div>
  );
}

/* ---------- Helpers ---------- */

function formatAnomalyType(type: string): string {
  switch (type) {
    case 'sigma_deviation': return 'Sigma Deviation';
    case 'usage_spike': return 'Usage Spike';
    case 'operator_anomaly': return 'Operator Anomaly';
    default: return type;
  }
}

function formatFieldName(field: string): string {
  return field.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

/* ---------- Styles ---------- */

const resultBannerStyle: React.CSSProperties = { padding: '0.75rem 1rem', borderLeft: '4px solid', background: 'var(--color-surface)', borderRadius: '0 4px 4px 0', marginBottom: '0.75rem', fontWeight: 500 };
const filterSelectStyle: React.CSSProperties = { padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid var(--color-border, #e5e7eb)', background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: '0.85rem' };
const severityBadgeStyle: React.CSSProperties = { display: 'inline-block', padding: '0.125rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, color: '#fff' };
const typeBadgeStyle: React.CSSProperties = { display: 'inline-block', padding: '0.125rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', background: 'var(--color-surface-alt, #f3f4f6)', color: 'var(--color-text)' };
const pillStyle: React.CSSProperties = { display: 'inline-block', padding: '0.125rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 500 };
const actionPillStyle: React.CSSProperties = { ...pillStyle, border: 'none', cursor: 'pointer', padding: '0.25rem 0.625rem', fontSize: '0.75rem', fontWeight: 600 };
