import { useEffect, useState, useCallback } from 'react';
import { apiGet, apiPost, apiPatch } from '@/data/repositories/http/apiClient';

interface Anomaly {
  id: string;
  asset_id: string | null;
  asset_serial: string | null;
  anomaly_type: string;
  field: string;
  expected_value: string | null;
  actual_value: string | null;
  sigma_distance: string | null;
  severity: string;
  status: string;
  created_at: string;
}

interface AnalyticsConfig {
  sigma_threshold?: string;
  detection_enabled?: string;
}

const SIGMA_OPTIONS = [
  { label: '2\u03C3', value: 2 },
  { label: '2.5\u03C3', value: 2.5 },
  { label: '3\u03C3', value: 3 },
];

export function AnalyticsPage() {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [config, setConfig] = useState<AnalyticsConfig>({});
  const [selectedSigma, setSelectedSigma] = useState<number>(2);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [anomalyRes, configRes] = await Promise.all([
        apiGet<Anomaly[]>('/analytics/anomalies'),
        apiGet<AnalyticsConfig>('/analytics/config'),
      ]);
      setAnomalies(anomalyRes.data);
      setConfig(configRes.data);
      if (configRes.data.sigma_threshold) {
        setSelectedSigma(Number(configRes.data.sigma_threshold));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleSigmaChange(value: number) {
    setSelectedSigma(value);
    try {
      const res = await apiPatch<AnalyticsConfig>('/analytics/config', {
        sigma_threshold: value,
      });
      setConfig(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update threshold');
    }
  }

  async function handleDetectAnomalies() {
    setLoading(true);
    try {
      await apiPost('/analytics/detect-anomalies', {});
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to detect anomalies');
      setLoading(false);
    }
  }

  function severityBadge(severity: string) {
    const isCritical = severity === 'critical';
    return (
      <span
        style={{
          display: 'inline-block',
          padding: '2px 10px',
          borderRadius: '9999px',
          fontSize: '0.75rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          background: isCritical
            ? 'var(--color-danger, #ef4444)'
            : 'var(--color-warning, #f59e0b)',
          color: '#fff',
        }}
      >
        {severity}
      </span>
    );
  }

  if (loading) {
    return (
      <div className="page">
        <h2>Predictive Analytics</h2>
        <p>Loading analytics data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <h2>Predictive Analytics</h2>
        <p style={{ color: 'var(--color-danger, #ef4444)' }}>{error}</p>
        <button className="btn-primary" onClick={fetchData}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="page">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <h2 style={{ margin: 0 }}>Predictive Analytics</h2>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button className="btn-primary" onClick={handleDetectAnomalies} style={{ fontSize: '0.85rem' }}>
            Run Detection
          </button>
          <button className="btn-primary" onClick={fetchData} style={{ fontSize: '0.85rem' }}>
            Refresh
          </button>
        </div>
      </div>

      {/* Sigma threshold selector */}
      <section style={{ marginBottom: '1.5rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            border: '1px solid var(--color-border, #333)',
            background: 'var(--color-surface, #1e1e2e)',
          }}
        >
          <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>
            Detection Threshold:
          </label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {SIGMA_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleSigmaChange(opt.value)}
                style={{
                  padding: '4px 14px',
                  borderRadius: '6px',
                  border: selectedSigma === opt.value
                    ? '2px solid var(--color-primary, #6366f1)'
                    : '1px solid var(--color-border, #555)',
                  background: selectedSigma === opt.value
                    ? 'var(--color-primary, #6366f1)'
                    : 'transparent',
                  color: selectedSigma === opt.value ? '#fff' : 'inherit',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            Current: {config.sigma_threshold ?? '2'}\u03C3
          </span>
        </div>
      </section>

      {/* Anomaly table */}
      <section>
        <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>
          Detected Anomalies ({anomalies.length})
        </h3>

        {anomalies.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)' }}>
            No anomalies detected. Run detection to scan for deviations.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>Asset</th>
                  <th style={thStyle}>Type</th>
                  <th style={thStyle}>Field</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Expected</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Actual</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Sigma</th>
                  <th style={thStyle}>Severity</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Detected</th>
                </tr>
              </thead>
              <tbody>
                {anomalies.map((a) => (
                  <tr key={a.id}>
                    <td style={tdStyle}>{a.asset_serial ?? a.asset_id?.slice(0, 8) ?? '-'}</td>
                    <td style={tdStyle}>{a.anomaly_type}</td>
                    <td style={tdStyle}>{a.field}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {a.expected_value ?? '-'}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {a.actual_value ?? '-'}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {a.sigma_distance ?? '-'}
                    </td>
                    <td style={tdStyle}>{severityBadge(a.severity)}</td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          background: 'var(--color-surface-alt, #2a2a3e)',
                        }}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      {a.created_at
                        ? new Date(a.created_at).toLocaleDateString()
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '0.6rem 0.75rem',
  borderBottom: '2px solid var(--color-border, #333)',
  fontSize: '0.8rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: 'var(--color-text-muted)',
};

const tdStyle: React.CSSProperties = {
  padding: '0.6rem 0.75rem',
  borderBottom: '1px solid var(--color-border, #333)',
};
