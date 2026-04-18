import { useState } from 'react';
import { useIncidents } from '@/hooks/useIncidents';
import { useAssets } from '@/hooks/useAssets';

const SEVERITY_ORDER: Record<string, number> = {
  critical: 0,
  functional: 1,
  cosmetic: 2,
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'maintenance',
  functional: 'idle',
  cosmetic: 'active',
};

/** Admin queue showing all incidents with filtering and resolution. */
export function IncidentQueue() {
  const { incidents, loading, resolveIncident } = useIncidents();
  const { assets } = useAssets();
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  const assetMap = new Map(assets.map((a) => [a.id, a]));

  const filtered = incidents
    .filter((i) => !severityFilter || i.severity === severityFilter)
    .filter((i) => !statusFilter || i.status === statusFilter)
    .sort((a, b) => {
      // Critical first
      const severityCmp =
        (SEVERITY_ORDER[a.severity] ?? 99) -
        (SEVERITY_ORDER[b.severity] ?? 99);
      if (severityCmp !== 0) return severityCmp;
      // Then by date descending
      return b.created_at.localeCompare(a.created_at);
    });

  async function handleResolve(id: string) {
    try {
      await resolveIncident(id, resolutionNotes || 'Resolved');
      setResolvingId(null);
      setResolutionNotes('');
    } catch {
      // Error handling via hook state
    }
  }

  if (loading) {
    return <p>Loading incidents...</p>;
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <div className="form-group">
          <label htmlFor="filter-severity">Filter Severity</label>
          <select
            id="filter-severity"
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
          >
            <option value="">All</option>
            <option value="cosmetic">Cosmetic</option>
            <option value="functional">Functional</option>
            <option value="critical">Critical</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="filter-status">Filter Status</label>
          <select
            id="filter-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All</option>
            <option value="open">Open</option>
            <option value="resolved">Resolved</option>
            <option value="maintenance_created">Maintenance Created</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p>No incidents found.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Asset</th>
              <th>Severity</th>
              <th>Description</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((incident) => {
              const asset = assetMap.get(incident.asset_id);
              return (
                <tr
                  key={incident.id}
                  className={
                    incident.severity === 'critical'
                      ? 'incident-critical'
                      : undefined
                  }
                >
                  <td>{asset?.serial_number ?? 'Unknown'}</td>
                  <td>
                    <span
                      className={`status-badge ${SEVERITY_COLORS[incident.severity] ?? ''}`}
                    >
                      {incident.severity}
                    </span>
                  </td>
                  <td>{incident.description}</td>
                  <td>
                    <span className={`status-badge ${incident.status}`}>
                      {incident.status}
                    </span>
                  </td>
                  <td>
                    {new Date(incident.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    {incident.status === 'open' && (
                      <>
                        {resolvingId === incident.id ? (
                          <div
                            style={{
                              display: 'flex',
                              gap: '0.5rem',
                              alignItems: 'center',
                            }}
                          >
                            <input
                              type="text"
                              placeholder="Resolution notes..."
                              value={resolutionNotes}
                              onChange={(e) =>
                                setResolutionNotes(e.target.value)
                              }
                              aria-label="Resolution notes"
                            />
                            <button
                              className="btn-primary"
                              onClick={() => handleResolve(incident.id)}
                            >
                              Confirm
                            </button>
                            <button
                              className="btn-outline"
                              onClick={() => {
                                setResolvingId(null);
                                setResolutionNotes('');
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            className="btn-primary"
                            onClick={() => setResolvingId(incident.id)}
                          >
                            Resolve
                          </button>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
