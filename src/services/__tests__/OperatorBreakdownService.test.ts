import { describe, it, expect } from 'vitest';
import { OperatorBreakdownService } from '../OperatorBreakdownService';

describe('OperatorBreakdownService', () => {
  it('returns operator stats', async () => {
    const service = new OperatorBreakdownService();
    const breakdown = await service.getBreakdown();

    expect(breakdown.length).toBe(5);
    expect(breakdown[0]?.operator_name).toBe('SkyShow Events');
  });

  it('returns all expected fields for each operator', async () => {
    const service = new OperatorBreakdownService();
    const breakdown = await service.getBreakdown();

    for (const op of breakdown) {
      expect(op.operator_name).toBeDefined();
      expect(op.allocated_drones).toBeGreaterThan(0);
      expect(op.utilization_pct).toBeGreaterThanOrEqual(0);
      expect(op.contribution_pct).toBeGreaterThanOrEqual(0);
    }
  });
});
