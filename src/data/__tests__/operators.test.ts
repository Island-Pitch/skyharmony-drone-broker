import { describe, it, expect } from 'vitest';
import { operators, type Operator } from '../operators';

describe('operators', () => {
  const EXPECTED_NAMES = [
    'NightBrite Drones',
    'Orion Skies',
    'Vegas Drone Works',
    'Patriotic Air',
    'Sky Harmony Fleet',
  ];

  it('exports exactly 5 operators', () => {
    expect(operators).toHaveLength(5);
  });

  it.each(EXPECTED_NAMES)('includes operator "%s"', (name) => {
    expect(operators.find((o: Operator) => o.name === name)).toBeDefined();
  });

  it('each operator has id, name, drone_count, and region', () => {
    for (const op of operators) {
      expect(op.id).toBeDefined();
      expect(op.name).toBeTruthy();
      expect(op.drone_count).toBeGreaterThan(0);
      expect(op.region).toBeTruthy();
    }
  });

  it('drone counts sum to 500', () => {
    const total = operators.reduce((sum: number, o: Operator) => sum + o.drone_count, 0);
    expect(total).toBe(500);
  });
});
