import { describe, it, expect, beforeEach } from 'vitest';
import { FleetSummaryService } from '../FleetSummaryService';
import { InMemoryAssetRepository } from '@/data/repositories/InMemoryAssetRepository';
import { store } from '@/data/store';
import { seedStore } from '@/data/seed';

describe('FleetSummaryService', () => {
  let summaryService: FleetSummaryService;

  beforeEach(() => {
    store.reset();
    seedStore();
    const repo = new InMemoryAssetRepository();
    summaryService = new FleetSummaryService(repo);
  });

  it('returns total asset count', async () => {
    const summary = await summaryService.getSummary();
    expect(summary.total_assets).toBeGreaterThanOrEqual(500);
  });

  it('returns counts by status', async () => {
    const summary = await summaryService.getSummary();
    const statusTotal = Object.values(summary.by_status).reduce((a, b) => a + b, 0);
    expect(statusTotal).toBe(summary.total_assets);
  });

  it('returns counts by type', async () => {
    const summary = await summaryService.getSummary();
    // Drone type uses deterministic UUID from seed
    const droneTypeId = '00000000-0000-4000-8000-000000000001';
    expect(summary.by_type[droneTypeId]).toBeGreaterThan(0);
  });

  it('calculates utilization percentage', async () => {
    const summary = await summaryService.getSummary();
    // utilization = (allocated + in_transit) / (total - retired)
    expect(summary.utilization_pct).toBeGreaterThanOrEqual(0);
    expect(summary.utilization_pct).toBeLessThanOrEqual(100);
  });

  it('returns counts by manufacturer', async () => {
    const summary = await summaryService.getSummary();
    expect(Object.keys(summary.by_manufacturer).length).toBeGreaterThan(0);
  });
});
