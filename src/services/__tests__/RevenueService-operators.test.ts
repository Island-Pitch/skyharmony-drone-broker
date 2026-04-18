import { describe, it, expect } from 'vitest';
import { RevenueService } from '../RevenueService';

describe('RevenueService — per-operator breakdown (SHD-52)', () => {
  it('returns per-operator revenue data', async () => {
    const service = new RevenueService();
    const detail = await service.getOperatorBreakdown();

    expect(detail.length).toBeGreaterThanOrEqual(5);
    for (const entry of detail) {
      expect(entry.operator_name).toBeTruthy();
      expect(entry.allocation_fee).toBeGreaterThanOrEqual(0);
      expect(entry.standby_fee).toBeGreaterThanOrEqual(0);
      expect(entry.insurance_pool).toBeGreaterThanOrEqual(0);
      expect(entry.total).toBeGreaterThan(0);
    }
  });

  it('operator totals sum to overall total_revenue', async () => {
    const service = new RevenueService();
    const summary = await service.getSummary();
    const breakdown = await service.getOperatorBreakdown();
    const sum = breakdown.reduce((s, e) => s + e.total, 0);
    expect(sum).toBe(summary.total_revenue);
  });
});
