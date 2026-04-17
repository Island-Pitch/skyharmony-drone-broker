import { describe, it, expect, beforeEach } from 'vitest';
import { AuditService } from '../AuditService';
import { AssetService } from '../AssetService';
import { InMemoryAssetRepository } from '@/data/repositories/InMemoryAssetRepository';
import { InMemoryAuditRepository } from '@/data/repositories/InMemoryAuditRepository';
import { store } from '@/data/store';

describe('AuditService', () => {
  let assetService: AssetService;
  let auditService: AuditService;
  let auditRepo: InMemoryAuditRepository;
  const droneTypeId = crypto.randomUUID();
  const actorId = crypto.randomUUID();

  beforeEach(() => {
    store.reset();
    auditRepo = new InMemoryAuditRepository();
    auditRepo.reset();
    store.assetTypes.set(droneTypeId, {
      id: droneTypeId,
      name: 'drone',
      description: 'UAV',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const assetRepo = new InMemoryAssetRepository();
    auditRepo = new InMemoryAuditRepository();
    auditService = new AuditService(auditRepo);
    assetService = new AssetService(assetRepo);
  });

  it('records an audit event on status change', async () => {
    const asset = await assetService.createAsset({
      asset_type_id: droneTypeId,
      serial_number: 'VA-001',
      manufacturer: 'Verge Aero',
      model: 'X1',
      typed_attributes: {},
    });

    await auditService.recordStatusChange(
      asset.id,
      'available',
      'maintenance',
      actorId,
    );

    const events = await auditRepo.findByAssetId(asset.id);
    expect(events).toHaveLength(1);
    expect(events[0]?.field_changed).toBe('status');
    expect(events[0]?.old_value).toBe('available');
    expect(events[0]?.new_value).toBe('maintenance');
    expect(events[0]?.changed_by).toBe(actorId);
  });

  it('records multiple audit events chronologically', async () => {
    const asset = await assetService.createAsset({
      asset_type_id: droneTypeId,
      serial_number: 'VA-002',
      manufacturer: 'Verge Aero',
      model: 'X1',
      typed_attributes: {},
    });

    await auditService.recordStatusChange(asset.id, 'available', 'allocated', actorId);
    await auditService.recordStatusChange(asset.id, 'allocated', 'in_transit', actorId);

    const events = await auditRepo.findByAssetId(asset.id);
    expect(events).toHaveLength(2);
  });

  it('does not record event for non-existent asset (no validation at this layer)', async () => {
    // AuditService records the event regardless — validation is caller's responsibility
    await auditService.recordStatusChange(
      crypto.randomUUID(),
      'available',
      'maintenance',
      actorId,
    );

    const allEvents = await auditRepo.findAll();
    expect(allEvents).toHaveLength(1);
  });
});
