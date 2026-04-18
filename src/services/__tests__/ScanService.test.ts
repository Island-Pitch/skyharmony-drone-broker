import { describe, it, expect, beforeEach } from 'vitest';
import { ScanService } from '../ScanService';
import { AuditService } from '../AuditService';
import { AssetService } from '../AssetService';
import { InMemoryAssetRepository } from '@/data/repositories/InMemoryAssetRepository';
import { InMemoryAuditRepository } from '@/data/repositories/InMemoryAuditRepository';
import { InMemoryCustodyRepository } from '@/data/repositories/InMemoryCustodyRepository';
import { store } from '@/data/store';

describe('ScanService', () => {
  let scanService: ScanService;
  let assetService: AssetService;
  let assetRepo: InMemoryAssetRepository;
  let custodyRepo: InMemoryCustodyRepository;
  let auditRepo: InMemoryAuditRepository;
  const droneTypeId = '00000000-0000-4000-8000-000000000001';
  const actorId = crypto.randomUUID();

  beforeEach(() => {
    store.reset();
    store.assetTypes.set(droneTypeId, {
      id: droneTypeId,
      name: 'drone',
      description: 'UAV',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    assetRepo = new InMemoryAssetRepository();
    auditRepo = new InMemoryAuditRepository();
    auditRepo.reset();
    custodyRepo = new InMemoryCustodyRepository();
    const auditService = new AuditService(auditRepo);
    assetService = new AssetService(assetRepo);
    scanService = new ScanService(assetRepo, custodyRepo, auditService);
  });

  describe('lookupBySerial', () => {
    it('finds an asset by serial number', async () => {
      const asset = await assetService.createAsset({
        asset_type_id: droneTypeId,
        serial_number: 'VE-0001',
        manufacturer: 'Verge Aero',
        model: 'X1',
        typed_attributes: {},
      });

      const found = await scanService.lookupBySerial('VE-0001');
      expect(found?.id).toBe(asset.id);
    });

    it('performs case-insensitive lookup', async () => {
      await assetService.createAsset({
        asset_type_id: droneTypeId,
        serial_number: 'VE-0001',
        manufacturer: 'Verge Aero',
        model: 'X1',
        typed_attributes: {},
      });

      const found = await scanService.lookupBySerial('ve-0001');
      expect(found).toBeDefined();
    });

    it('returns undefined for unknown serial', async () => {
      const found = await scanService.lookupBySerial('UNKNOWN-999');
      expect(found).toBeUndefined();
    });
  });

  describe('checkOut', () => {
    it('checks out an available asset', async () => {
      await assetService.createAsset({
        asset_type_id: droneTypeId,
        serial_number: 'VE-0010',
        manufacturer: 'Verge Aero',
        model: 'X1',
        typed_attributes: {},
      });

      const result = await scanService.checkOut('VE-0010', actorId);

      expect(result.asset.status).toBe('allocated');
      expect(result.custodyEvent.action).toBe('check_out');
      expect(result.custodyEvent.actor_id).toBe(actorId);
    });

    it('records an audit event on check-out', async () => {
      const asset = await assetService.createAsset({
        asset_type_id: droneTypeId,
        serial_number: 'VE-0011',
        manufacturer: 'Verge Aero',
        model: 'X1',
        typed_attributes: {},
      });

      await scanService.checkOut('VE-0011', actorId);

      const auditEvents = await auditRepo.findByAssetId(asset.id);
      expect(auditEvents).toHaveLength(1);
      expect(auditEvents[0]?.old_value).toBe('available');
      expect(auditEvents[0]?.new_value).toBe('allocated');
    });

    it('associates booking_id with custody event', async () => {
      await assetService.createAsset({
        asset_type_id: droneTypeId,
        serial_number: 'VE-0012',
        manufacturer: 'Verge Aero',
        model: 'X1',
        typed_attributes: {},
      });

      const bookingId = crypto.randomUUID();
      const result = await scanService.checkOut('VE-0012', actorId, bookingId);
      expect(result.custodyEvent.booking_id).toBe(bookingId);
    });

    it('throws when asset not found', async () => {
      await expect(
        scanService.checkOut('UNKNOWN-999', actorId),
      ).rejects.toThrow('Asset not found');
    });

    it('throws when asset is not available', async () => {
      const asset = await assetService.createAsset({
        asset_type_id: droneTypeId,
        serial_number: 'VE-0013',
        manufacturer: 'Verge Aero',
        model: 'X1',
        typed_attributes: {},
      });

      await assetRepo.update(asset.id, { status: 'maintenance' });

      await expect(
        scanService.checkOut('VE-0013', actorId),
      ).rejects.toThrow('cannot be checked out');
    });
  });

  describe('checkIn', () => {
    it('checks in an allocated asset', async () => {
      await assetService.createAsset({
        asset_type_id: droneTypeId,
        serial_number: 'VE-0020',
        manufacturer: 'Verge Aero',
        model: 'X1',
        typed_attributes: {},
      });

      await scanService.checkOut('VE-0020', actorId);
      const result = await scanService.checkIn('VE-0020', actorId);

      expect(result.asset.status).toBe('available');
      expect(result.custodyEvent.action).toBe('check_in');
    });

    it('throws when asset not found', async () => {
      await expect(
        scanService.checkIn('UNKNOWN-999', actorId),
      ).rejects.toThrow('Asset not found');
    });

    it('throws when asset is not allocated', async () => {
      await assetService.createAsset({
        asset_type_id: droneTypeId,
        serial_number: 'VE-0021',
        manufacturer: 'Verge Aero',
        model: 'X1',
        typed_attributes: {},
      });

      await expect(
        scanService.checkIn('VE-0021', actorId),
      ).rejects.toThrow('cannot be checked in');
    });
  });

  describe('getCustodyHistory', () => {
    it('returns custody events for an asset', async () => {
      const asset = await assetService.createAsset({
        asset_type_id: droneTypeId,
        serial_number: 'VE-0030',
        manufacturer: 'Verge Aero',
        model: 'X1',
        typed_attributes: {},
      });

      await scanService.checkOut('VE-0030', actorId);
      await scanService.checkIn('VE-0030', actorId);

      const history = await scanService.getCustodyHistory(asset.id);
      expect(history).toHaveLength(2);
      expect(history[0]?.action).toBe('check_out');
      expect(history[1]?.action).toBe('check_in');
    });
  });
});
