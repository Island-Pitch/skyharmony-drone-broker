import type { AuditEvent } from '../../models/audit';
import type { IAuditRepository } from '../InMemoryAuditRepository';

/** Audit events are created server-side. This repo is read-only on the client. */
export class HttpAuditRepository implements IAuditRepository {
  async create(data: Partial<AuditEvent>): Promise<AuditEvent> {
    // Audit events are created server-side during status changes.
    // Return a stub so client-side callers don't break.
    return { ...data, id: '' } as unknown as AuditEvent;
  }

  async findByAssetId(): Promise<AuditEvent[]> {
    // TODO: Add GET /api/fleet/:id/audit endpoint when needed
    return [];
  }

  async findAll(): Promise<AuditEvent[]> {
    return [];
  }

  reset(): void {
    // No-op for HTTP client
  }
}
