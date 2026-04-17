import type { Asset } from '@/data/models/asset';
import { CreateAssetInputSchema, UpdateAssetInputSchema } from '@/data/models/asset';
import type { IAssetRepository } from '@/data/repositories/interfaces';

/** Service layer for asset CRUD. Validates input with Zod before delegating to the repository. */
export class AssetService {
  constructor(private readonly assetRepo: IAssetRepository) {}

  async createAsset(input: unknown): Promise<Asset> {
    const validated = CreateAssetInputSchema.parse(input);
    return this.assetRepo.create(validated);
  }

  async getAsset(id: string): Promise<Asset | undefined> {
    return this.assetRepo.findById(id);
  }

  async updateAsset(id: string, input: unknown): Promise<Asset> {
    const validated = UpdateAssetInputSchema.parse(input);
    return this.assetRepo.update(id, validated);
  }

  async listAssets(): Promise<Asset[]> {
    return this.assetRepo.findAll();
  }

  async deleteAsset(id: string): Promise<void> {
    return this.assetRepo.delete(id);
  }

  async getAccessories(parentId: string): Promise<Asset[]> {
    return this.assetRepo.findByParent(parentId);
  }
}
