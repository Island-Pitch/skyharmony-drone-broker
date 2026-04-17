import { describe, it, expect, beforeEach } from 'vitest';
import { AssetQueryService } from '../AssetQueryService';
import { InMemoryAssetRepository } from '@/data/repositories/InMemoryAssetRepository';
import { store } from '@/data/store';
import type { CreateAssetInput } from '@/data/models/asset';

describe('AssetQueryService', () => {
  let queryService: AssetQueryService;
  let repo: InMemoryAssetRepository;
  const droneTypeId = crypto.randomUUID();
  const baseStationTypeId = crypto.randomUUID();

  beforeEach(async () => {
    store.reset();
    store.assetTypes.set(droneTypeId, {
      id: droneTypeId,
      name: 'drone',
      description: 'UAV',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    store.assetTypes.set(baseStationTypeId, {
      id: baseStationTypeId,
      name: 'base_station',
      description: 'Ground control',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    repo = new InMemoryAssetRepository();
    queryService = new AssetQueryService(repo);

    // Seed data: 3 drones (2 available, 1 maintenance) + 2 base stations
    const makeDrone = (sn: string, overrides?: Partial<CreateAssetInput>): CreateAssetInput => ({
      asset_type_id: droneTypeId,
      serial_number: sn,
      manufacturer: 'Verge Aero',
      model: 'X1',
      typed_attributes: {},
      ...overrides,
    });

    await repo.create(makeDrone('D-001'));
    await repo.create(makeDrone('D-002'));
    const d3 = await repo.create(makeDrone('D-003'));
    await repo.update(d3.id, { status: 'maintenance' });

    await repo.create({
      asset_type_id: baseStationTypeId,
      serial_number: 'BS-001',
      manufacturer: 'DJI',
      model: 'RC Plus',
      typed_attributes: {},
    });
    await repo.create({
      asset_type_id: baseStationTypeId,
      serial_number: 'BS-002',
      manufacturer: 'DJI',
      model: 'RC Plus',
      typed_attributes: {},
    });
  });

  describe('query', () => {
    it('returns all assets with no filters', async () => {
      const result = await queryService.query({}, { page: 1, per_page: 50 });
      expect(result.total).toBe(5);
      expect(result.data).toHaveLength(5);
    });

    it('filters by type_id', async () => {
      const result = await queryService.query(
        { type_id: droneTypeId },
        { page: 1, per_page: 50 },
      );
      expect(result.total).toBe(3);
      expect(result.data.every((a) => a.asset_type_id === droneTypeId)).toBe(true);
    });

    it('filters by status', async () => {
      const result = await queryService.query(
        { status: 'available' },
        { page: 1, per_page: 50 },
      );
      expect(result.total).toBe(4); // 2 drones + 2 base stations
    });

    it('combines type and status filters', async () => {
      const result = await queryService.query(
        { type_id: droneTypeId, status: 'available' },
        { page: 1, per_page: 50 },
      );
      expect(result.total).toBe(2);
    });

    it('filters by manufacturer', async () => {
      const result = await queryService.query(
        { manufacturer: 'DJI' },
        { page: 1, per_page: 50 },
      );
      expect(result.total).toBe(2);
    });

    it('searches by serial number', async () => {
      const result = await queryService.query(
        { search: 'BS-001' },
        { page: 1, per_page: 50 },
      );
      expect(result.total).toBe(1);
      expect(result.data[0]?.serial_number).toBe('BS-001');
    });

    it('searches by model (case insensitive)', async () => {
      const result = await queryService.query(
        { search: 'rc plus' },
        { page: 1, per_page: 50 },
      );
      expect(result.total).toBe(2);
    });

    it('paginates results', async () => {
      const page1 = await queryService.query({}, { page: 1, per_page: 2 });
      expect(page1.data).toHaveLength(2);
      expect(page1.total).toBe(5);
      expect(page1.total_pages).toBe(3);
      expect(page1.page).toBe(1);

      const page2 = await queryService.query({}, { page: 2, per_page: 2 });
      expect(page2.data).toHaveLength(2);

      const page3 = await queryService.query({}, { page: 3, per_page: 2 });
      expect(page3.data).toHaveLength(1);
    });

    it('returns empty result for page beyond data', async () => {
      const result = await queryService.query({}, { page: 100, per_page: 50 });
      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(5);
    });
  });
});
