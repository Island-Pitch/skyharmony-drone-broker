import { describe, it, expect } from 'vitest';
import { RevenueService } from '../RevenueService';

describe('RevenueService', () => {
  it('returns revenue summary data', async () => {
    const service = new RevenueService();
    const summary = await service.getSummary();

    expect(summary.total_revenue).toBe(284_500);
    expect(summary.allocation_fee_revenue).toBe(198_150);
    expect(summary.standby_fee_revenue).toBe(86_350);
    expect(summary.pending_invoices).toBe(12);
  });

  it('returns consistent data across calls', async () => {
    const service = new RevenueService();
    const first = await service.getSummary();
    const second = await service.getSummary();
    expect(first).toEqual(second);
  });
});
