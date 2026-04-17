import type { IAuditRepository } from '@/data/repositories/InMemoryAuditRepository';
import type { AuditEvent } from '@/data/models/audit';

/** Records audit events when asset fields change. */
export class AuditService {
  constructor(private readonly auditRepo: IAuditRepository) {}

  async recordStatusChange(
    assetId: string,
    oldStatus: string,
    newStatus: string,
    actorId: string,
  ): Promise<AuditEvent> {
    return this.auditRepo.create({
      asset_id: assetId,
      field_changed: 'status',
      old_value: oldStatus,
      new_value: newStatus,
      changed_by: actorId,
    });
  }

  async getAssetAuditLog(assetId: string): Promise<AuditEvent[]> {
    return this.auditRepo.findByAssetId(assetId);
  }
}
