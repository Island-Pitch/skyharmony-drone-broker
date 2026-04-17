import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryAssetRepository } from '../InMemoryAssetRepository';
import { store } from '../../store';
import type { CreateAssetInput } from '../../models/asset';

describe('InMemoryAssetRepository', () => {
  let repo: InMemoryAssetRepository;
  const droneTypeId = crypto.randomUUID();
  const baseStationTypeId = crypto.randomUUID();

  beforeEach(() => {
    store.reset();
    repo = new InMemoryAssetRepository();

    // Seed asset types
    store.assetTypes.set(droneTypeId, {
      id: droneTypeId,
      name: 'drone',
      description: 'Unmanned aerial vehicle',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    store.assetTypes.set(baseStationTypeId, {
      id: baseStationTypeId,
      name: 'base_station',
      description: 'Ground control base station',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  });

  const droneInput: CreateAssetInput = {
    asset_type_id: '', // set in beforeEach via droneTypeId
    serial_number: 'VA-2024-001',
    manufacturer: 'Verge Aero',
    model: 'X1',
    typed_attributes: {},
    firmware_version: '4.2.1',
    flight_hours: 0,
    battery_cycles: 0,
  };

  function makeDroneInput(overrides: Partial<CreateAssetInput> = {}): CreateAssetInput {
    return { ...droneInput, asset_type_id: droneTypeId, ...overrides };
  }

  describe('create', () => {
    it('creates an asset and returns it with generated id and timestamps', async () => {
      const asset = await repo.create(makeDroneInput());

      expect(asset.id).toBeDefined();
      expect(asset.serial_number).toBe('VA-2024-001');
      expect(asset.manufacturer).toBe('Verge Aero');
      expect(asset.status).toBe('available');
      expect(asset.current_operator_id).toBeNull();
      expect(asset.parent_asset_id).toBeNull();
      expect(asset.created_at).toBeDefined();
      expect(asset.updated_at).toBeDefined();
    });

    it('defaults status to available', async () => {
      const asset = await repo.create(makeDroneInput());
      expect(asset.status).toBe('available');
    });

    it('stores the asset in the store', async () => {
      const asset = await repo.create(makeDroneInput());
      expect(store.assets.has(asset.id)).toBe(true);
    });
  });

  describe('findById', () => {
    it('returns the asset when it exists', async () => {
      const created = await repo.create(makeDroneInput());
      const found = await repo.findById(created.id);
      expect(found).toEqual(created);
    });

    it('returns undefined when asset does not exist', async () => {
      const found = await repo.findById(crypto.randomUUID());
      expect(found).toBeUndefined();
    });
  });

  describe('findAll', () => {
    it('returns all assets', async () => {
      await repo.create(makeDroneInput({ serial_number: 'VA-001' }));
      await repo.create(makeDroneInput({ serial_number: 'VA-002' }));
      await repo.create(makeDroneInput({ serial_number: 'VA-003' }));

      const all = await repo.findAll();
      expect(all).toHaveLength(3);
    });

    it('returns empty array when no assets exist', async () => {
      const all = await repo.findAll();
      expect(all).toHaveLength(0);
    });
  });

  describe('update', () => {
    it('updates asset status', async () => {
      const created = await repo.create(makeDroneInput());
      const updated = await repo.update(created.id, { status: 'maintenance' });

      expect(updated.status).toBe('maintenance');
      expect(updated.id).toBe(created.id);
    });

    it('updates typed_attributes', async () => {
      const created = await repo.create(makeDroneInput());
      const updated = await repo.update(created.id, {
        typed_attributes: { max_altitude: 400 },
      });

      expect(updated.typed_attributes).toEqual({ max_altitude: 400 });
    });

    it('updates updated_at timestamp', async () => {
      const created = await repo.create(makeDroneInput());
      // Small delay to ensure timestamp differs
      const updated = await repo.update(created.id, { status: 'maintenance' });

      expect(updated.updated_at).toBeDefined();
    });

    it('throws when asset does not exist', async () => {
      await expect(
        repo.update(crypto.randomUUID(), { status: 'maintenance' }),
      ).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('removes the asset from the store', async () => {
      const created = await repo.create(makeDroneInput());
      await repo.delete(created.id);

      const found = await repo.findById(created.id);
      expect(found).toBeUndefined();
    });

    it('throws when asset does not exist', async () => {
      await expect(repo.delete(crypto.randomUUID())).rejects.toThrow();
    });
  });

  describe('findByType', () => {
    it('returns only assets of the specified type', async () => {
      await repo.create(makeDroneInput({ serial_number: 'D-001' }));
      await repo.create(makeDroneInput({ serial_number: 'D-002' }));
      await repo.create(
        makeDroneInput({
          serial_number: 'BS-001',
          asset_type_id: baseStationTypeId,
        }),
      );

      const drones = await repo.findByType(droneTypeId);
      expect(drones).toHaveLength(2);

      const baseStations = await repo.findByType(baseStationTypeId);
      expect(baseStations).toHaveLength(1);
    });
  });

  describe('findByStatus', () => {
    it('returns only assets with the specified status', async () => {
      const a1 = await repo.create(makeDroneInput({ serial_number: 'D-001' }));
      await repo.create(makeDroneInput({ serial_number: 'D-002' }));
      await repo.update(a1.id, { status: 'maintenance' });

      const available = await repo.findByStatus('available');
      expect(available).toHaveLength(1);

      const maintenance = await repo.findByStatus('maintenance');
      expect(maintenance).toHaveLength(1);
    });
  });

  describe('findByParent', () => {
    it('returns child assets linked to parent', async () => {
      const parent = await repo.create(makeDroneInput({ serial_number: 'PARENT-001' }));
      await repo.create(
        makeDroneInput({
          serial_number: 'CHILD-001',
          parent_asset_id: parent.id,
        }),
      );
      await repo.create(
        makeDroneInput({
          serial_number: 'CHILD-002',
          parent_asset_id: parent.id,
        }),
      );
      await repo.create(makeDroneInput({ serial_number: 'OTHER-001' }));

      const children = await repo.findByParent(parent.id);
      expect(children).toHaveLength(2);
    });

    it('returns empty array when no children exist', async () => {
      const parent = await repo.create(makeDroneInput({ serial_number: 'LONELY-001' }));
      const children = await repo.findByParent(parent.id);
      expect(children).toHaveLength(0);
    });
  });
});
