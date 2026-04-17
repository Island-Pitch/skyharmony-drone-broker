import { describe, it, expect, beforeEach } from 'vitest';
import { AssetService } from '../AssetService';
import { InMemoryAssetRepository } from '@/data/repositories/InMemoryAssetRepository';
import { store } from '@/data/store';

describe('AssetService', () => {
  let service: AssetService;
  const droneTypeId = crypto.randomUUID();

  beforeEach(() => {
    store.reset();
    store.assetTypes.set(droneTypeId, {
      id: droneTypeId,
      name: 'drone',
      description: 'UAV',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    const repo = new InMemoryAssetRepository();
    service = new AssetService(repo);
  });

  describe('createAsset', () => {
    it('creates an asset with valid input', async () => {
      const asset = await service.createAsset({
        asset_type_id: droneTypeId,
        serial_number: 'VA-001',
        manufacturer: 'Verge Aero',
        model: 'X1',
        typed_attributes: {},
      });

      expect(asset.id).toBeDefined();
      expect(asset.serial_number).toBe('VA-001');
      expect(asset.status).toBe('available');
    });

    it('rejects invalid input (missing serial_number)', async () => {
      await expect(
        service.createAsset({
          asset_type_id: droneTypeId,
          manufacturer: 'Verge Aero',
          model: 'X1',
          typed_attributes: {},
        } as never),
      ).rejects.toThrow();
    });
  });

  describe('getAsset', () => {
    it('returns an asset by id', async () => {
      const created = await service.createAsset({
        asset_type_id: droneTypeId,
        serial_number: 'VA-002',
        manufacturer: 'Verge Aero',
        model: 'X1',
        typed_attributes: {},
      });

      const found = await service.getAsset(created.id);
      expect(found).toEqual(created);
    });

    it('returns undefined for non-existent id', async () => {
      const found = await service.getAsset(crypto.randomUUID());
      expect(found).toBeUndefined();
    });
  });

  describe('updateAsset', () => {
    it('updates asset status with valid input', async () => {
      const created = await service.createAsset({
        asset_type_id: droneTypeId,
        serial_number: 'VA-003',
        manufacturer: 'Verge Aero',
        model: 'X1',
        typed_attributes: {},
      });

      const updated = await service.updateAsset(created.id, {
        status: 'maintenance',
      });

      expect(updated.status).toBe('maintenance');
    });

    it('rejects invalid status value', async () => {
      const created = await service.createAsset({
        asset_type_id: droneTypeId,
        serial_number: 'VA-004',
        manufacturer: 'Verge Aero',
        model: 'X1',
        typed_attributes: {},
      });

      await expect(
        service.updateAsset(created.id, { status: 'flying' } as never),
      ).rejects.toThrow();
    });
  });

  describe('listAssets', () => {
    it('returns all assets', async () => {
      await service.createAsset({
        asset_type_id: droneTypeId,
        serial_number: 'VA-005',
        manufacturer: 'Verge Aero',
        model: 'X1',
        typed_attributes: {},
      });
      await service.createAsset({
        asset_type_id: droneTypeId,
        serial_number: 'VA-006',
        manufacturer: 'DJI',
        model: 'M30',
        typed_attributes: {},
      });

      const assets = await service.listAssets();
      expect(assets).toHaveLength(2);
    });
  });

  describe('deleteAsset', () => {
    it('deletes an asset', async () => {
      const created = await service.createAsset({
        asset_type_id: droneTypeId,
        serial_number: 'VA-007',
        manufacturer: 'Verge Aero',
        model: 'X1',
        typed_attributes: {},
      });

      await service.deleteAsset(created.id);
      const found = await service.getAsset(created.id);
      expect(found).toBeUndefined();
    });
  });
});
