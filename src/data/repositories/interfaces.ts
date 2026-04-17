import type {
  Asset,
  AssetStatusValue,
  CreateAssetInput,
  UpdateAssetInput,
} from '../models/asset';

export interface Pagination {
  page: number;
  per_page: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface AssetFilters {
  type_id?: string;
  status?: AssetStatusValue;
  manufacturer?: string;
  search?: string;
}

export interface IAssetRepository {
  findById(id: string): Promise<Asset | undefined>;
  findAll(): Promise<Asset[]>;
  create(input: CreateAssetInput): Promise<Asset>;
  update(id: string, input: UpdateAssetInput): Promise<Asset>;
  delete(id: string): Promise<void>;
  findByType(typeId: string): Promise<Asset[]>;
  findByStatus(status: AssetStatusValue): Promise<Asset[]>;
  findByParent(parentId: string): Promise<Asset[]>;
  query(filters: AssetFilters, pagination: Pagination): Promise<PaginatedResult<Asset>>;
}
