import { useForecasting } from '@/hooks/useForecasting';
import type { ForecastEntry, HeatmapRegion, SupplyAlert } from '@/hooks/useForecasting';

/** Format YYYY-MM to a human-readable month label. */
function formatMonth(ym: string): string {
  const [y, m] = ym.split('-');
  const date = new Date(Number(y), Number(m) - 1);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
}

/** Determine color token for balance status. */
function balanceColor(balance: number): string {
  if (balance > 50) return 'var(--color-success, #22c55e)';
  if (balance >= 0) return 'var(--color-warning, #f59e0b)';
  return 'var(--color-danger, #ef4444)';
}

function balanceLabel(balance: number): string {
  if (balance > 50) return 'Surplus';
  if (balance >= 0) return 'Tight';
  return 'Shortage';
}

/* ---------- Sub-components ---------- */

function ForecastTable({ forecasts }: { forecasts: ForecastEntry[] }) {
  if (forecasts.length === 0) {
    return <p style={{ color: 'var(--color-text-muted)' }}>No forecast data available.</p>;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={thStyle}>Month</th>
            <th style={thStyle}>Region</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>Predicted Drones</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>Confidence</th>
          </tr>
        </thead>
        <tbody>
          {forecasts.map((f, i) => (
            <tr key={i} style={rowStyle}>
              <td style={tdStyle}>{formatMonth(f.month)}</td>
              <td style={tdStyle}>{f.region}</td>
              <td style={{ ...tdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                {f.predicted_drone_demand.toLocaleString()}
              </td>
              <td style={{ ...tdStyle, textAlign: 'right' }}>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    background:
                      f.confidence >= 70
                        ? 'var(--color-success, #22c55e)'
                        : 'var(--color-warning, #f59e0b)',
                    color: '#fff',
                  }}
                >
                  {f.confidence}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RegionBalanceCards({ regions }: { regions: HeatmapRegion[] }) {
  if (regions.length === 0) {
    return <p style={{ color: 'var(--color-text-muted)' }}>No regional data available.</p>;
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
      {regions.map((r) => {
        const color = balanceColor(r.balance);
        const label = balanceLabel(r.balance);
        return (
          <div
            key={r.name}
            style={{
              border: `2px solid ${color}`,
              borderRadius: '12px',
              padding: '1.25rem',
              background: 'var(--color-surface, #1e1e2e)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h4 style={{ margin: 0, fontSize: '1.05rem' }}>{r.name}</h4>
              <span
                style={{
                  padding: '2px 10px',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  background: color,
                  color: '#fff',
                }}
              >
                {label}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Demand</span>
              <span style={{ fontWeight: 600 }}>{r.demand_score.toLocaleString()} drones</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Supply</span>
              <span style={{ fontWeight: 600 }}>{r.supply_count.toLocaleString()} drones</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Balance</span>
              <span style={{ fontWeight: 600, color }}>{r.balance > 0 ? '+' : ''}{r.balance.toLocaleString()}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AlertsList({ alerts }: { alerts: SupplyAlert[] }) {
  if (alerts.length === 0) {
    return (
      <p style={{ color: 'var(--color-success, #22c55e)', fontWeight: 500 }}>
        All regions within supply capacity.
      </p>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {alerts.map((a, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            border: `1px solid ${a.severity === 'critical' ? 'var(--color-danger, #ef4444)' : 'var(--color-warning, #f59e0b)'}`,
            background: a.severity === 'critical' ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)',
          }}
        >
          <span style={{ fontSize: '1.2rem' }}>{a.severity === 'critical' ? '\u26A0' : '\u25B2'}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, marginBottom: '0.15rem' }}>{a.region}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{a.message}</div>
          </div>
          <span
            style={{
              padding: '2px 10px',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 700,
              background: a.severity === 'critical' ? 'var(--color-danger, #ef4444)' : 'var(--color-warning, #f59e0b)',
              color: '#fff',
              textTransform: 'uppercase',
            }}
          >
            {a.severity}
          </span>
        </div>
      ))}
    </div>
  );
}

function DemandBarChart({ forecasts }: { forecasts: ForecastEntry[] }) {
  if (forecasts.length === 0) return null;

  // Aggregate by region across all months
  const regionTotals = new Map<string, number>();
  for (const f of forecasts) {
    regionTotals.set(f.region, (regionTotals.get(f.region) ?? 0) + f.predicted_drone_demand);
  }

  const entries = Array.from(regionTotals.entries()).sort((a, b) => b[1] - a[1]);
  const max = Math.max(...entries.map(([, v]) => v), 1);

  const barColors = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {entries.map(([region, total], i) => {
        const pct = (total / max) * 100;
        return (
          <div key={region}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
              <span style={{ fontWeight: 500 }}>{region}</span>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{total.toLocaleString()} drones</span>
            </div>
            <div
              style={{
                height: '24px',
                background: 'var(--color-surface-alt, #2a2a3e)',
                borderRadius: '6px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${pct}%`,
                  background: barColors[i % barColors.length],
                  borderRadius: '6px',
                  transition: 'width 0.5s ease',
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Styles ---------- */

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

const rowStyle: React.CSSProperties = {};

/* ---------- Main page ---------- */

export function ForecastingPage() {
  const { forecasts, regions, alerts, loading, error, refresh } = useForecasting();

  if (loading) {
    return (
      <div className="page">
        <h2>Demand Forecasting</h2>
        <p>Loading forecast data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <h2>Demand Forecasting</h2>
        <p style={{ color: 'var(--color-danger, #ef4444)' }}>
          Failed to load forecasting data: {error.message}
        </p>
        <button className="btn-primary" onClick={refresh}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0 }}>Demand Forecasting</h2>
        <button className="btn-primary" onClick={refresh} style={{ fontSize: '0.85rem' }}>
          Refresh
        </button>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <section style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Supply Alerts</h3>
          <AlertsList alerts={alerts} />
        </section>
      )}

      {/* Demand bar chart */}
      <section style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Projected Demand by Region</h3>
        <DemandBarChart forecasts={forecasts} />
      </section>

      {/* Regional balance */}
      <section style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Regional Supply Balance</h3>
        <RegionBalanceCards regions={regions} />
      </section>

      {/* Forecast table */}
      <section style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>90-Day Forecast</h3>
        <ForecastTable forecasts={forecasts} />
      </section>
    </div>
  );
}
