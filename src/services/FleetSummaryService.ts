import type { IAssetRepository } from '@/data/repositories/interfaces';

export interface FleetSummary {
  total_assets: number;
  by_status: Record<string, number>;
  by_type: Record<string, number>;
  by_manufacturer: Record<string, number>;
  utilization_pct: number;
}

/** Aggregates fleet-wide statistics from the asset repository. */
export class FleetSummaryService {
  constructor(private readonly assetRepo: IAssetRepository) {}

  async getSummary(): Promise<FleetSummary> {
    const assets = await this.assetRepo.findAll();

    const by_status: Record<string, number> = {};
    const by_type: Record<string, number> = {};
    const by_manufacturer: Record<string, number> = {};

    for (const asset of assets) {
      by_status[asset.status] = (by_status[asset.status] ?? 0) + 1;
      by_type[asset.asset_type_id] = (by_type[asset.asset_type_id] ?? 0) + 1;
      by_manufacturer[asset.manufacturer] = (by_manufacturer[asset.manufacturer] ?? 0) + 1;
    }

    const total = assets.length;
    const retired = by_status['retired'] ?? 0;
    const allocated = by_status['allocated'] ?? 0;
    const inTransit = by_status['in_transit'] ?? 0;
    const active = total - retired;
    const utilization_pct = active > 0
      ? Math.round(((allocated + inTransit) / active) * 1000) / 10
      : 0;

    return {
      total_assets: total,
      by_status,
      by_type,
      by_manufacturer,
      utilization_pct,
    };
  }
}
