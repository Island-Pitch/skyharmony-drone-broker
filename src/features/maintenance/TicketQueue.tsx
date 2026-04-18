import { useState } from 'react';
import type { MaintenanceTicket } from '@/hooks/useMaintenance';
import { TicketDetail } from './TicketDetail';

interface TicketQueueProps {
  tickets: MaintenanceTicket[];
  loading: boolean;
  onUpdate: (id: string, input: Partial<MaintenanceTicket>) => Promise<unknown>;
  onComplete: (id: string, resolutionNotes?: string) => Promise<unknown>;
}

const SEVERITY_COLORS: Record<string, string> = {
  warning: 'idle',
  mandatory_ground: 'maintenance',
};

const STATUS_ORDER: Record<string, number> = {
  open: 0,
  assigned: 1,
  in_progress: 2,
  verification: 3,
  complete: 4,
};

/** Ticket list with status workflow buttons and detail drill-down. */
export function TicketQueue({ tickets, loading, onUpdate, onComplete }: TicketQueueProps) {
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  const filtered = tickets
    .filter((t) => !statusFilter || t.status === statusFilter)
    .filter((t) => !severityFilter || t.severity === severityFilter)
    .sort((a, b) => {
      const statusCmp = (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99);
      if (statusCmp !== 0) return statusCmp;
      return b.created_at.localeCompare(a.created_at);
    });

  const selectedTicket = selectedTicketId
    ? tickets.find((t) => t.id === selectedTicketId)
    : null;

  if (selectedTicket) {
    return (
      <TicketDetail
        ticket={selectedTicket}
        onUpdate={onUpdate}
        onComplete={onComplete}
        onClose={() => setSelectedTicketId(null)}
      />
    );
  }

  if (loading) return <p>Loading tickets...</p>;

  return (
    <div>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <div className="form-group">
          <label htmlFor="ticket-status-filter">Status</label>
          <select
            id="ticket-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All</option>
            <option value="open">Open</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="verification">Verification</option>
            <option value="complete">Complete</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="ticket-severity-filter">Severity</label>
          <select
            id="ticket-severity-filter"
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
          >
            <option value="">All</option>
            <option value="warning">Warning</option>
            <option value="mandatory_ground">Mandatory Ground</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p>No maintenance tickets found.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Severity</th>
              <th>Status</th>
              <th>Description</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((ticket) => (
              <tr key={ticket.id}>
                <td>{ticket.ticket_type}</td>
                <td>
                  <span className={`status-badge ${SEVERITY_COLORS[ticket.severity] ?? ''}`}>
                    {ticket.severity.replace('_', ' ')}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${ticket.status}`}>
                    {ticket.status.replace('_', ' ')}
                  </span>
                </td>
                <td style={{ maxWidth: '20rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {ticket.description}
                </td>
                <td>{new Date(ticket.created_at).toLocaleDateString()}</td>
                <td>
                  <button
                    className="btn-outline"
                    onClick={() => setSelectedTicketId(ticket.id)}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
