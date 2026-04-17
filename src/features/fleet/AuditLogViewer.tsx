import type { AuditEvent } from '@/data/models/audit';

interface AuditLogViewerProps {
  events: AuditEvent[];
}

export function AuditLogViewer({ events }: AuditLogViewerProps) {
  if (events.length === 0) {
    return <p className="empty-state">No audit events recorded.</p>;
  }

  return (
    <div className="audit-log">
      <h4>Audit Trail</h4>
      <table className="data-table data-table--compact">
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Field</th>
            <th>From</th>
            <th>To</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr key={event.id}>
              <td>{new Date(event.changed_at).toLocaleString()}</td>
              <td>{event.field_changed}</td>
              <td>{event.old_value ?? '—'}</td>
              <td>{event.new_value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
