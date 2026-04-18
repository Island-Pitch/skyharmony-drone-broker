import type { Asset, AssetStatusValue, CreateAssetInput, UpdateAssetInput } from '../../models/asset';
import type { IAssetRepository, AssetFilters, Pagination, PaginatedResult } from '../interfaces';
import { apiGet, apiPost, apiPatch, apiDelete } from './apiClient';

export class HttpAssetRepository implements IAssetRepository {
  async findById(id: string): Promise<Asset | undefined> {
    try {
      const res = await apiGet<Asset>(`/fleet/${id}`);
      return res.data;
    } catch {
      return undefined;
    }
  }

  async findAll(): Promise<Asset[]> {
    const res = await apiGet<Asset[]>('/fleet?per_page=10000');
    return res.data;
  }

  async create(input: CreateAssetInput): Promise<Asset> {
    const res = await apiPost<Asset>('/fleet', input);
    return res.data;
  }

  async update(id: string, input: UpdateAssetInput): Promise<Asset> {
    const res = await apiPatch<Asset>(`/fleet/${id}`, input);
    return res.data;
  }

  async delete(id: string): Promise<void> {
    await apiDelete(`/fleet/${id}`);
  }

  async findByType(typeId: string): Promise<Asset[]> {
    const res = await apiGet<Asset[]>(`/fleet?type=${typeId}&per_page=10000`);
    return res.data;
  }

  async findByStatus(status: AssetStatusValue): Promise<Asset[]> {
    const res = await apiGet<Asset[]>(`/fleet?status=${status}&per_page=10000`);
    return res.data;
  }

  async findByParent(parentId: string): Promise<Asset[]> {
    const all = await this.findAll();
    return all.filter((a) => a.parent_asset_id === parentId);
  }

  async query(filters: AssetFilters, pagination: Pagination): Promise<PaginatedResult<Asset>> {
    const params = new URLSearchParams();
    if (filters.type_id) params.set('type', filters.type_id);
    if (filters.status) params.set('status', filters.status);
    if (filters.search) params.set('search', filters.search);
    if (filters.manufacturer) params.set('manufacturer', filters.manufacturer);
    params.set('page', String(pagination.page));
    params.set('per_page', String(pagination.per_page));

    const res = await apiGet<Asset[]>(`/fleet?${params}`);
    return {
      data: res.data,
      total: res.meta?.total ?? res.data.length,
      page: res.meta?.page ?? pagination.page,
      per_page: res.meta?.per_page ?? pagination.per_page,
      total_pages: res.meta?.total_pages ?? 1,
    };
  }
}
