import { db } from '../db/connection.js';
import { auditEvents } from '../db/schema.js';

interface AuditLogEntry {
  action: string;
  actorId: string;
  targetType: string;
  targetId: string;
  details?: Record<string, unknown>;
}

export async function auditLog(entry: AuditLogEntry): Promise<void> {
  try {
    await db.insert(auditEvents).values({
      field_changed: entry.action,
      changed_by: entry.actorId,
      asset_id: entry.targetType === 'asset' ? entry.targetId : null,
      new_value: JSON.stringify({
        target_type: entry.targetType,
        target_id: entry.targetId,
        ...entry.details,
      }),
    });
  } catch (err) {
    // Audit logging should never break the request
    console.error('Audit log write failed:', err);
  }
}
