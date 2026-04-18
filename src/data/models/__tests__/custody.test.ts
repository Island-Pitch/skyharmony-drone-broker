import { describe, it, expect } from 'vitest';
import { CustodyEventSchema, CustodyAction } from '../custody';

describe('CustodyEvent schema', () => {
  const validEvent = {
    id: crypto.randomUUID(),
    asset_id: crypto.randomUUID(),
    action: 'check_out' as const,
    actor_id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  };

  it('parses a valid check_out event', () => {
    const result = CustodyEventSchema.safeParse(validEvent);
    expect(result.success).toBe(true);
  });

  it('parses a valid check_in event', () => {
    const result = CustodyEventSchema.safeParse({
      ...validEvent,
      action: 'check_in',
    });
    expect(result.success).toBe(true);
  });

  it('accepts optional booking_id', () => {
    const result = CustodyEventSchema.safeParse({
      ...validEvent,
      booking_id: crypto.randomUUID(),
    });
    expect(result.success).toBe(true);
  });

  it('accepts optional mac_address', () => {
    const result = CustodyEventSchema.safeParse({
      ...validEvent,
      mac_address: 'AA:BB:CC:DD:EE:FF',
    });
    expect(result.success).toBe(true);
  });

  it('accepts optional notes', () => {
    const result = CustodyEventSchema.safeParse({
      ...validEvent,
      notes: 'Pre-flight check completed',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid action', () => {
    const result = CustodyEventSchema.safeParse({
      ...validEvent,
      action: 'transfer',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing asset_id', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { asset_id: _, ...noAssetId } = validEvent;
    const result = CustodyEventSchema.safeParse(noAssetId);
    expect(result.success).toBe(false);
  });

  it('CustodyAction enum has correct values', () => {
    expect(CustodyAction.options).toEqual(['check_out', 'check_in']);
  });
});
