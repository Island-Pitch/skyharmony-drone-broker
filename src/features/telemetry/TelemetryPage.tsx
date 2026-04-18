import { useState } from 'react';
import { useTelemetry, type SimulateResult } from '@/hooks/useTelemetry';

/** SHD-22: Verge Aero telemetry sync dashboard. */
export function TelemetryPage() {
  const { coverage, loadingCoverage, simulate, refreshCoverage } = useTelemetry();

  const [simulating, setSimulating] = useState(false);
  const [simulateResult, setSimulateResult] = useState<SimulateResult | null>(null);
  const [simulateError, setSimulateError] = useState<string | null>(null);

  async function handleSimulate() {
    setSimulating(true);
    setSimulateError(null);
    setSimulateResult(null);
    try {
      const result = await simulate();
      setSimulateResult(result);
    } catch (err) {
      setSimulateError(err instanceof Error ? err.message : 'Simulation failed');
    } finally {
      setSimulating(false);
    }
  }

  const faultAlerts = coverage?.fault_alerts ?? [];
  const coveragePct = coverage?.coverage_pct ?? 0;

  return (
    <div className="page">
      <h2>Telemetry</h2>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
        Verge Aero Mothership API — mock telemetry sync integration
      </p>

      {/* Coverage Stats */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        <StatCard
          label="Coverage (24h)"
          value={loadingCoverage ? '...' : `${coveragePct}%`}
          accent={coveragePct >= 80 ? 'var(--color-success, #22c55e)' : coveragePct >= 50 ? 'var(--color-warning, #f59e0b)' : 'var(--color-danger, #ef4444)'}
        />
        <StatCard
          label="Active Drones"
          value={loadingCoverage ? '...' : String(coverage?.total_active ?? 0)}
        />
        <StatCard
          label="Synced (24h)"
          value={loadingCoverage ? '...' : String(coverage?.synced_last_24h ?? 0)}
        />
        <StatCard
          label="Fault Alerts"
          value={loadingCoverage ? '...' : String(faultAlerts.length)}
          accent={faultAlerts.length > 0 ? 'var(--color-danger, #ef4444)' : undefined}
        />
      </div>

      {/* Simulate Button */}
      <div style={{ marginBottom: '2rem' }}>
        <button className="btn-primary" onClick={handleSimulate} disabled={simulating}>
          {simulating ? 'Simulating...' : 'Simulate Sync'}
        </button>
        <button
          className="btn-primary btn-secondary"
          onClick={() => refreshCoverage()}
          disabled={loadingCoverage}
          style={{ marginLeft: '0.5rem', background: 'var(--color-surface)', color: 'var(--color-text)' }}
        >
          Refresh
        </button>

        {simulateResult && (
          <p style={{ marginTop: '0.75rem', fontWeight: 'bold' }}>
            Synced {simulateResult.synced} drone(s). {simulateResult.faulted > 0 ? `${simulateResult.faulted} drone(s) flagged with faults.` : 'No faults detected.'}
          </p>
        )}
        {simulateError && (
          <p style={{ marginTop: '0.75rem', color: 'var(--color-danger, #ef4444)' }}>{simulateError}</p>
        )}
      </div>

      {/* Fault Code Alerts */}
      {faultAlerts.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h3>Fault Code Alerts</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Asset ID</th>
                  <th>Fault Codes</th>
                  <th>Source</th>
                  <th>Synced At</th>
                </tr>
              </thead>
              <tbody>
                {faultAlerts.map((sync) => (
                  <tr key={sync.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                      {sync.asset_id ? sync.asset_id.slice(0, 8) + '...' : 'N/A'}
                    </td>
                    <td>
                      {(sync.fault_codes ?? []).map((code) => (
                        <span
                          key={code}
                          style={{
                            display: 'inline-block',
                            background: 'var(--color-danger, #ef4444)',
                            color: '#fff',
                            padding: '0.125rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.8rem',
                            marginRight: '0.25rem',
                            marginBottom: '0.125rem',
                          }}
                        >
                          {code}
                        </span>
                      ))}
                    </td>
                    <td>{sync.source}</td>
                    <td>{formatDate(sync.synced_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Simulate Results */}
      {simulateResult && simulateResult.results.length > 0 && (
        <div>
          <h3>Recent Sync Results</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Serial Number</th>
                  <th>Flight Hours (+)</th>
                  <th>Battery Cycles (+)</th>
                  <th>Faults</th>
                </tr>
              </thead>
              <tbody>
                {simulateResult.results.map((r) => (
                  <tr key={r.serial_number}>
                    <td style={{ fontFamily: 'monospace' }}>{r.serial_number}</td>
                    <td>+{r.flight_hours_delta.toFixed(1)}</td>
                    <td>+{r.battery_cycles_delta}</td>
                    <td>
                      {r.fault_codes.length > 0
                        ? r.fault_codes.map((code) => (
                            <span
                              key={code}
                              style={{
                                display: 'inline-block',
                                background: 'var(--color-danger, #ef4444)',
                                color: '#fff',
                                padding: '0.125rem 0.5rem',
                                borderRadius: '4px',
                                fontSize: '0.8rem',
                                marginRight: '0.25rem',
                              }}
                            >
                              {code}
                            </span>
                          ))
                        : 'None'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Helpers ---------- */

function StatCard({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div
      style={{
        flex: '1 1 140px',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border, #e5e7eb)',
        borderRadius: '8px',
        padding: '1rem 1.25rem',
        minWidth: '140px',
      }}
    >
      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
        {label}
      </div>
      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: accent ?? 'var(--color-text)' }}>
        {value}
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}
