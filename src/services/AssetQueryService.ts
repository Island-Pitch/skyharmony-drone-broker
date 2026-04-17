import type { IAssetRepository, AssetFilters, Pagination, PaginatedResult } from '@/data/repositories/interfaces';
import type { Asset } from '@/data/models/asset';

/** Service for filtered, paginated asset queries. */
export class AssetQueryService {
  constructor(private readonly assetRepo: IAssetRepository) {}

  async query(
    filters: AssetFilters,
    pagination: Pagination,
  ): Promise<PaginatedResult<Asset>> {
    return this.assetRepo.query(filters, pagination);
  }
}
