import { describe, it, expect, beforeEach } from 'vitest';
import { seedStore } from '../seed';
import { store } from '../store';
import { operators } from '../operators';

describe('seedStore — operator assignment (SHD-50)', () => {
  beforeEach(() => {
    store.reset();
    seedStore();
  });

  it('assigns drones to the 5 named operators', () => {
    const operatorIds = new Set(operators.map((o) => o.id));
    const drones = Array.from(store.assets.values()).filter(
      (a) => a.asset_type_id === '00000000-0000-4000-8000-000000000001',
    );

    // At least some drones should be assigned to named operators
    for (const opId of operatorIds) {
      const count = drones.filter((d) => d.current_operator_id === opId).length;
      expect(count).toBeGreaterThan(0);
    }
  });

  it('seeds 20+ bookings with CA/AZ/NV locations', () => {
    const bookings = Array.from(store.bookings.values());
    expect(bookings.length).toBeGreaterThanOrEqual(20);

    const locations = bookings.map((b) => b.location);
    const hasCA = locations.some((l) => l.includes('CA'));
    const hasAZ = locations.some((l) => l.includes('AZ'));
    const hasNV = locations.some((l) => l.includes('NV'));

    expect(hasCA).toBe(true);
    expect(hasAZ).toBe(true);
    expect(hasNV).toBe(true);
  });
});
