import { describe, it, expect } from 'vitest';
import {
  BookingSchema,
  BookingStatus,
  CreateBookingInputSchema,
  UpdateBookingInputSchema,
} from '../booking';

describe('BookingSchema', () => {
  const validBooking = {
    id: crypto.randomUUID(),
    operator_id: crypto.randomUUID(),
    operator_name: 'SkyShow Events',
    show_date: '2026-05-01T20:00:00.000Z',
    drone_count: 100,
    location: 'Miami Beach, FL',
    status: 'pending' as const,
    allocated_assets: [],
    created_at: '2026-04-01T00:00:00.000Z',
    updated_at: '2026-04-01T00:00:00.000Z',
  };

  it('parses a valid booking', () => {
    const result = BookingSchema.parse(validBooking);
    expect(result.id).toBe(validBooking.id);
    expect(result.operator_name).toBe('SkyShow Events');
  });

  it('accepts optional end_date and notes', () => {
    const result = BookingSchema.parse({
      ...validBooking,
      end_date: '2026-05-02T00:00:00.000Z',
      notes: 'Special event',
    });
    expect(result.end_date).toBe('2026-05-02T00:00:00.000Z');
    expect(result.notes).toBe('Special event');
  });

  it('rejects invalid status', () => {
    expect(() =>
      BookingSchema.parse({ ...validBooking, status: 'flying' }),
    ).toThrow();
  });

  it('rejects non-positive drone_count', () => {
    expect(() =>
      BookingSchema.parse({ ...validBooking, drone_count: 0 }),
    ).toThrow();
  });

  it('rejects negative drone_count', () => {
    expect(() =>
      BookingSchema.parse({ ...validBooking, drone_count: -1 }),
    ).toThrow();
  });
});

describe('BookingStatus', () => {
  it('contains all expected statuses', () => {
    const statuses = BookingStatus.options;
    expect(statuses).toContain('pending');
    expect(statuses).toContain('allocated');
    expect(statuses).toContain('confirmed');
    expect(statuses).toContain('completed');
    expect(statuses).toContain('cancelled');
  });
});

describe('CreateBookingInputSchema', () => {
  it('parses valid create input', () => {
    const result = CreateBookingInputSchema.parse({
      operator_id: crypto.randomUUID(),
      operator_name: 'Test Operator',
      show_date: '2026-06-01T18:00:00.000Z',
      drone_count: 50,
      location: 'Austin, TX',
    });
    expect(result.operator_name).toBe('Test Operator');
  });

  it('rejects missing required fields', () => {
    expect(() =>
      CreateBookingInputSchema.parse({
        operator_id: crypto.randomUUID(),
      }),
    ).toThrow();
  });
});

describe('UpdateBookingInputSchema', () => {
  it('parses partial update', () => {
    const result = UpdateBookingInputSchema.parse({
      drone_count: 75,
    });
    expect(result.drone_count).toBe(75);
  });

  it('accepts empty object', () => {
    const result = UpdateBookingInputSchema.parse({});
    expect(result).toBeDefined();
  });
});
