import type { AuditEvent } from '../models/audit';

export interface IAuditRepository {
  create(event: Omit<AuditEvent, 'id' | 'changed_at'>): Promise<AuditEvent>;
  findByAssetId(assetId: string): Promise<AuditEvent[]>;
  findAll(): Promise<AuditEvent[]>;
}

const auditStore = new Map<string, AuditEvent>();

export class InMemoryAuditRepository implements IAuditRepository {
  async create(input: Omit<AuditEvent, 'id' | 'changed_at'>): Promise<AuditEvent> {
    const event: AuditEvent = {
      ...input,
      id: crypto.randomUUID(),
      changed_at: new Date().toISOString(),
    };
    auditStore.set(event.id, event);
    return event;
  }

  async findByAssetId(assetId: string): Promise<AuditEvent[]> {
    return Array.from(auditStore.values())
      .filter((e) => e.asset_id === assetId)
      .sort((a, b) => a.changed_at.localeCompare(b.changed_at));
  }

  async findAll(): Promise<AuditEvent[]> {
    return Array.from(auditStore.values());
  }

  reset(): void {
    auditStore.clear();
  }
}
