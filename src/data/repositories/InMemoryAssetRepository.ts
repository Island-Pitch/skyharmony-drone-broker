import type { Asset, AssetStatusValue, CreateAssetInput, UpdateAssetInput } from '../models/asset';
import type { IAssetRepository, AssetFilters, Pagination, PaginatedResult } from './interfaces';
import { store } from '../store';

export class InMemoryAssetRepository implements IAssetRepository {
  async create(input: CreateAssetInput): Promise<Asset> {
    const now = new Date().toISOString();
    const asset: Asset = {
      id: crypto.randomUUID(),
      asset_type_id: input.asset_type_id,
      serial_number: input.serial_number,
      manufacturer: input.manufacturer,
      model: input.model,
      status: 'available',
      firmware_version: input.firmware_version,
      flight_hours: input.flight_hours,
      battery_cycles: input.battery_cycles,
      typed_attributes: input.typed_attributes,
      current_operator_id: null,
      parent_asset_id: input.parent_asset_id ?? null,
      created_at: now,
      updated_at: now,
    };
    store.assets.set(asset.id, asset);
    return asset;
  }

  async findById(id: string): Promise<Asset | undefined> {
    return store.assets.get(id);
  }

  async findAll(): Promise<Asset[]> {
    return Array.from(store.assets.values());
  }

  async update(id: string, input: UpdateAssetInput): Promise<Asset> {
    const existing = store.assets.get(id);
    if (!existing) {
      throw new Error(`Asset not found: ${id}`);
    }

    const updated: Asset = {
      ...existing,
      ...Object.fromEntries(
        Object.entries(input).filter(([, v]) => v !== undefined),
      ),
      updated_at: new Date().toISOString(),
    };

    store.assets.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    if (!store.assets.has(id)) {
      throw new Error(`Asset not found: ${id}`);
    }
    store.assets.delete(id);
  }

  async findByType(typeId: string): Promise<Asset[]> {
    return Array.from(store.assets.values()).filter(
      (a) => a.asset_type_id === typeId,
    );
  }

  async findByStatus(status: AssetStatusValue): Promise<Asset[]> {
    return Array.from(store.assets.values()).filter(
      (a) => a.status === status,
    );
  }

  async findByParent(parentId: string): Promise<Asset[]> {
    return Array.from(store.assets.values()).filter(
      (a) => a.parent_asset_id === parentId,
    );
  }

  async query(
    filters: AssetFilters,
    pagination: Pagination,
  ): Promise<PaginatedResult<Asset>> {
    let results = Array.from(store.assets.values());

    if (filters.type_id) {
      results = results.filter((a) => a.asset_type_id === filters.type_id);
    }
    if (filters.status) {
      results = results.filter((a) => a.status === filters.status);
    }
    if (filters.manufacturer) {
      results = results.filter((a) => a.manufacturer === filters.manufacturer);
    }
    if (filters.search) {
      const term = filters.search.toLowerCase();
      results = results.filter(
        (a) =>
          a.serial_number.toLowerCase().includes(term) ||
          a.model.toLowerCase().includes(term),
      );
    }

    const total = results.length;
    const start = (pagination.page - 1) * pagination.per_page;
    const data = results.slice(start, start + pagination.per_page);

    return {
      data,
      total,
      page: pagination.page,
      per_page: pagination.per_page,
      total_pages: Math.ceil(total / pagination.per_page),
    };
  }
}
