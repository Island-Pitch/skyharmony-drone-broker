import { useState } from 'react';
import type { MaintenanceTicket } from '@/hooks/useMaintenance';

interface TicketDetailProps {
  ticket: MaintenanceTicket;
  onUpdate: (id: string, input: Partial<MaintenanceTicket>) => Promise<unknown>;
  onComplete: (id: string, resolutionNotes?: string) => Promise<unknown>;
  onClose: () => void;
}

const STATUS_FLOW = ['open', 'assigned', 'in_progress', 'verification', 'complete'] as const;

const SEVERITY_COLORS: Record<string, string> = {
  warning: 'idle',
  mandatory_ground: 'maintenance',
};

/** Single ticket detail view with asset info, assignment, and resolution notes. */
export function TicketDetail({ ticket, onUpdate, onComplete, onClose }: TicketDetailProps) {
  const [resolutionNotes, setResolutionNotes] = useState(ticket.resolution_notes ?? '');
  const [assignTo, setAssignTo] = useState(ticket.assigned_to ?? '');
  const [saving, setSaving] = useState(false);

  const currentIdx = STATUS_FLOW.indexOf(ticket.status as (typeof STATUS_FLOW)[number]);
  const canAdvance = currentIdx >= 0 && currentIdx < STATUS_FLOW.length - 1;
  const nextStatus = canAdvance ? STATUS_FLOW[currentIdx + 1] : null;

  async function handleAdvance() {
    if (!nextStatus) return;
    setSaving(true);
    try {
      if (nextStatus === 'complete') {
        await onComplete(ticket.id, resolutionNotes || undefined);
      } else {
        const updates: Partial<MaintenanceTicket> = { status: nextStatus };
        if (nextStatus === 'assigned' && assignTo) {
          updates.assigned_to = assignTo;
        }
        await onUpdate(ticket.id, updates);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveNotes() {
    setSaving(true);
    try {
      await onUpdate(ticket.id, { resolution_notes: resolutionNotes });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ border: '1px solid var(--color-border)', borderRadius: '8px', padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0 }}>Ticket Detail</h3>
        <button className="btn-outline" onClick={onClose}>Close</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <strong>Type:</strong> {ticket.ticket_type}
        </div>
        <div>
          <strong>Status:</strong>{' '}
          <span className={`status-badge ${ticket.status}`}>{ticket.status.replace('_', ' ')}</span>
        </div>
        <div>
          <strong>Severity:</strong>{' '}
          <span className={`status-badge ${SEVERITY_COLORS[ticket.severity] ?? ''}`}>
            {ticket.severity.replace('_', ' ')}
          </span>
        </div>
        <div>
          <strong>Asset ID:</strong> {ticket.asset_id ?? 'N/A'}
        </div>
        <div>
          <strong>Created:</strong> {new Date(ticket.created_at).toLocaleString()}
        </div>
        <div>
          <strong>Updated:</strong> {new Date(ticket.updated_at).toLocaleString()}
        </div>
        {ticket.completed_at && (
          <div>
            <strong>Completed:</strong> {new Date(ticket.completed_at).toLocaleString()}
          </div>
        )}
        {ticket.parts_needed && (
          <div style={{ gridColumn: '1 / -1' }}>
            <strong>Parts Needed:</strong> {ticket.parts_needed}
          </div>
        )}
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <strong>Description:</strong>
        <p>{ticket.description}</p>
      </div>

      {ticket.status !== 'complete' && (
        <>
          {(ticket.status === 'open' || !ticket.assigned_to) && (
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label htmlFor="assign-to">Assign To (User ID)</label>
              <input
                id="assign-to"
                type="text"
                value={assignTo}
                onChange={(e) => setAssignTo(e.target.value)}
                placeholder="Enter user UUID"
              />
            </div>
          )}

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label htmlFor="resolution-notes">Resolution Notes</label>
            <textarea
              id="resolution-notes"
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              rows={3}
              placeholder="Enter resolution notes..."
              style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}
            />
            <button className="btn-outline" onClick={handleSaveNotes} disabled={saving} style={{ marginTop: '0.5rem' }}>
              Save Notes
            </button>
          </div>

          {canAdvance && nextStatus && (
            <button className="btn-primary" onClick={handleAdvance} disabled={saving}>
              {saving ? 'Saving...' : `Advance to: ${nextStatus.replace('_', ' ')}`}
            </button>
          )}
        </>
      )}
    </div>
  );
}
