import { describe, it, expect, beforeEach } from 'vitest';
import { store } from '@/data/store';
import { InMemoryAssetRepository } from '@/data/repositories/InMemoryAssetRepository';
import { InMemoryBookingRepository } from '@/data/repositories/InMemoryBookingRepository';
import { InMemoryAuditRepository } from '@/data/repositories/InMemoryAuditRepository';
import { BookingService } from '@/services/BookingService';
import { AuditService } from '@/services/AuditService';
import { AllocationService } from '@/services/AllocationService';
import { createMockAsset, createMockBooking } from '@/test/helpers';

const DRONE_TYPE_ID = '00000000-0000-4000-8000-000000000001';
const ACTOR_ID = '00000000-0000-4000-9000-000000000099';

function makeDrone(serial: string, overrides: Record<string, unknown> = {}) {
  return createMockAsset(DRONE_TYPE_ID, {
    serial_number: serial,
    status: 'available',
    ...overrides,
  });
}

function makeBooking(overrides: Record<string, unknown> = {}) {
  return createMockBooking(overrides as Partial<ReturnType<typeof createMockBooking>>);
}

describe('AllocationService', () => {
  let assetRepo: InMemoryAssetRepository;
  let bookingRepo: InMemoryBookingRepository;
  let bookingService: BookingService;
  let auditService: AuditService;
  let allocationService: AllocationService;

  beforeEach(() => {
    store.reset();
    assetRepo = new InMemoryAssetRepository();
    bookingRepo = new InMemoryBookingRepository();
    const auditRepo = new InMemoryAuditRepository();
    bookingService = new BookingService(bookingRepo);
    auditService = new AuditService(auditRepo);
    allocationService = new AllocationService(
      assetRepo,
      bookingRepo,
      bookingService,
      auditService,
    );
  });

  // ---- Availability Query ----

  describe('getAvailableDrones', () => {
    it('returns only drones with status "available"', async () => {
      const d1 = makeDrone('DR-0001', { status: 'available' });
      const d2 = makeDrone('DR-0002', { status: 'maintenance' });
      const d3 = makeDrone('DR-0003', { status: 'retired' });
      const d4 = makeDrone('DR-0004', { status: 'allocated' });
      store.assets.set(d1.id, d1);
      store.assets.set(d2.id, d2);
      store.assets.set(d3.id, d3);
      store.assets.set(d4.id, d4);

      const result = await allocationService.getAvailableDrones('2026-06-01T00:00:00.000Z');
      expect(result).toHaveLength(1);
      expect(result[0]!.id).toBe(d1.id);
    });

    it('excludes drones allocated to overlapping bookings', async () => {
      const d1 = makeDrone('DR-0001');
      const d2 = makeDrone('DR-0002');
      store.assets.set(d1.id, d1);
      store.assets.set(d2.id, d2);

      // Booking that overlaps with query date, with d1 allocated
      const booking = makeBooking({
        show_date: '2026-06-01T10:00:00.000Z',
        end_date: '2026-06-01T14:00:00.000Z',
        status: 'allocated',
        allocated_assets: [d1.id],
      });
      store.bookings.set(booking.id, booking);

      const result = await allocationService.getAvailableDrones(
        '2026-06-01T12:00:00.000Z',
        '2026-06-01T16:00:00.000Z',
      );
      expect(result).toHaveLength(1);
      expect(result[0]!.id).toBe(d2.id);
    });

    it('includes drones from non-overlapping bookings', async () => {
      const d1 = makeDrone('DR-0001');
      store.assets.set(d1.id, d1);

      // Booking on a different day
      const booking = makeBooking({
        show_date: '2026-07-01T10:00:00.000Z',
        end_date: '2026-07-01T14:00:00.000Z',
        status: 'allocated',
        allocated_assets: [d1.id],
      });
      store.bookings.set(booking.id, booking);

      const result = await allocationService.getAvailableDrones('2026-06-01T12:00:00.000Z');
      expect(result).toHaveLength(1);
    });

    it('returns drones sorted by serial number for determinism', async () => {
      const d3 = makeDrone('DR-0003');
      const d1 = makeDrone('DR-0001');
      const d2 = makeDrone('DR-0002');
      store.assets.set(d3.id, d3);
      store.assets.set(d1.id, d1);
      store.assets.set(d2.id, d2);

      const result = await allocationService.getAvailableDrones('2026-06-01T00:00:00.000Z');
      expect(result.map((d) => d.serial_number)).toEqual([
        'DR-0001',
        'DR-0002',
        'DR-0003',
      ]);
    });

    it('ignores completed and cancelled bookings when checking conflicts', async () => {
      const d1 = makeDrone('DR-0001');
      store.assets.set(d1.id, d1);

      const completed = makeBooking({
        show_date: '2026-06-01T10:00:00.000Z',
        end_date: '2026-06-01T14:00:00.000Z',
        status: 'completed',
        allocated_assets: [d1.id],
      });
      const cancelled = makeBooking({
        show_date: '2026-06-01T10:00:00.000Z',
        end_date: '2026-06-01T14:00:00.000Z',
        status: 'cancelled',
        allocated_assets: [d1.id],
      });
      store.bookings.set(completed.id, completed);
      store.bookings.set(cancelled.id, cancelled);

      const result = await allocationService.getAvailableDrones('2026-06-01T12:00:00.000Z');
      expect(result).toHaveLength(1);
    });

    it('only returns drones (not batteries or base stations)', async () => {
      const drone = makeDrone('DR-0001');
      const battery = createMockAsset('00000000-0000-4000-8000-000000000002', {
        serial_number: 'BAT-0001',
        status: 'available',
      });
      store.assets.set(drone.id, drone);
      store.assets.set(battery.id, battery);

      const result = await allocationService.getAvailableDrones('2026-06-01T00:00:00.000Z');
      expect(result).toHaveLength(1);
      expect(result[0]!.serial_number).toBe('DR-0001');
    });
  });

  // ---- Conflict Detection ----

  describe('detectConflicts', () => {
    it('returns shortfall equal to drone_count when no assets allocated', async () => {
      const booking = makeBooking({ drone_count: 10 });
      store.bookings.set(booking.id, booking);

      const result = await allocationService.detectConflicts(booking.id);
      expect(result.conflicts).toHaveLength(0);
      expect(result.available).toHaveLength(0);
      expect(result.shortfall).toBe(10);
    });

    it('detects conflicting assets shared with overlapping bookings', async () => {
      const d1 = makeDrone('DR-0001');
      const d2 = makeDrone('DR-0002');
      store.assets.set(d1.id, d1);
      store.assets.set(d2.id, d2);

      // Booking A has both drones
      const bookingA = makeBooking({
        show_date: '2026-06-01T10:00:00.000Z',
        end_date: '2026-06-01T14:00:00.000Z',
        status: 'allocated',
        allocated_assets: [d1.id, d2.id],
        drone_count: 2,
      });

      // Booking B also claims d1
      const bookingB = makeBooking({
        show_date: '2026-06-01T12:00:00.000Z',
        end_date: '2026-06-01T16:00:00.000Z',
        status: 'allocated',
        allocated_assets: [d1.id],
        drone_count: 1,
      });

      store.bookings.set(bookingA.id, bookingA);
      store.bookings.set(bookingB.id, bookingB);

      const result = await allocationService.detectConflicts(bookingA.id);
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0]!.id).toBe(d1.id);
      expect(result.available).toHaveLength(1);
      expect(result.available[0]!.id).toBe(d2.id);
      expect(result.shortfall).toBe(1);
    });

    it('reports no conflicts when bookings do not overlap', async () => {
      const d1 = makeDrone('DR-0001');
      store.assets.set(d1.id, d1);

      const bookingA = makeBooking({
        show_date: '2026-06-01T10:00:00.000Z',
        end_date: '2026-06-01T14:00:00.000Z',
        status: 'allocated',
        allocated_assets: [d1.id],
        drone_count: 1,
      });
      const bookingB = makeBooking({
        show_date: '2026-07-01T10:00:00.000Z',
        end_date: '2026-07-01T14:00:00.000Z',
        status: 'allocated',
        allocated_assets: [d1.id],
        drone_count: 1,
      });

      store.bookings.set(bookingA.id, bookingA);
      store.bookings.set(bookingB.id, bookingB);

      const result = await allocationService.detectConflicts(bookingA.id);
      expect(result.conflicts).toHaveLength(0);
      expect(result.available).toHaveLength(1);
      expect(result.shortfall).toBe(0);
    });

    it('throws if booking not found', async () => {
      await expect(
        allocationService.detectConflicts('nonexistent-id'),
      ).rejects.toThrow('Booking not found');
    });
  });

  // ---- Alternative Date Suggestions ----

  describe('suggestAlternativeDates', () => {
    it('returns up to 3 alternative dates with sufficient drones', async () => {
      // Create 5 available drones
      for (let i = 1; i <= 5; i++) {
        const d = makeDrone(`DR-${String(i).padStart(4, '0')}`);
        store.assets.set(d.id, d);
      }

      const result = await allocationService.suggestAlternativeDates(
        3,
        '2026-06-15T12:00:00.000Z',
        7,
      );

      expect(result.length).toBeLessThanOrEqual(3);
      expect(result.length).toBeGreaterThan(0);
      for (const alt of result) {
        expect(alt.availableCount).toBeGreaterThanOrEqual(3);
      }
    });

    it('returns empty if no dates have enough drones', async () => {
      // Only 2 drones, requesting 10
      const d1 = makeDrone('DR-0001');
      const d2 = makeDrone('DR-0002');
      store.assets.set(d1.id, d1);
      store.assets.set(d2.id, d2);

      const result = await allocationService.suggestAlternativeDates(
        10,
        '2026-06-15T12:00:00.000Z',
        3,
      );

      expect(result).toHaveLength(0);
    });

    it('excludes the preferred date itself', async () => {
      for (let i = 1; i <= 5; i++) {
        const d = makeDrone(`DR-${String(i).padStart(4, '0')}`);
        store.assets.set(d.id, d);
      }

      const preferredDate = '2026-06-15T12:00:00.000Z';
      const result = await allocationService.suggestAlternativeDates(
        3,
        preferredDate,
        7,
      );

      for (const alt of result) {
        expect(alt.date).not.toBe(preferredDate);
      }
    });

    it('sorts alternatives by availability count descending', async () => {
      for (let i = 1; i <= 5; i++) {
        const d = makeDrone(`DR-${String(i).padStart(4, '0')}`);
        store.assets.set(d.id, d);
      }

      const result = await allocationService.suggestAlternativeDates(
        1,
        '2026-06-15T12:00:00.000Z',
        3,
      );

      for (let i = 1; i < result.length; i++) {
        expect(result[i - 1]!.availableCount).toBeGreaterThanOrEqual(
          result[i]!.availableCount,
        );
      }
    });
  });

  // ---- Allocation Execution ----

  describe('allocate', () => {
    it('allocates drones and transitions booking to allocated', async () => {
      const d1 = makeDrone('DR-0001');
      const d2 = makeDrone('DR-0002');
      const d3 = makeDrone('DR-0003');
      store.assets.set(d1.id, d1);
      store.assets.set(d2.id, d2);
      store.assets.set(d3.id, d3);

      const booking = makeBooking({
        show_date: '2026-06-01T10:00:00.000Z',
        end_date: '2026-06-01T14:00:00.000Z',
        drone_count: 2,
        status: 'pending',
      });
      store.bookings.set(booking.id, booking);

      const result = await allocationService.allocate(booking.id, ACTOR_ID);

      // Should allocate exactly 2 drones (the first 2 by serial number)
      expect(result.allocated).toHaveLength(2);
      expect(result.shortfall).toBe(0);
      expect(result.alternatives).toBeUndefined();

      // Verify drones are updated
      const updatedD1 = store.assets.get(d1.id)!;
      const updatedD2 = store.assets.get(d2.id)!;
      const updatedD3 = store.assets.get(d3.id)!;
      expect(updatedD1.status).toBe('allocated');
      expect(updatedD1.current_operator_id).toBe(booking.operator_id);
      expect(updatedD2.status).toBe('allocated');
      expect(updatedD3.status).toBe('available'); // not allocated

      // Verify booking is updated
      const updatedBooking = store.bookings.get(booking.id)!;
      expect(updatedBooking.status).toBe('allocated');
      expect(updatedBooking.allocated_assets).toHaveLength(2);
    });

    it('performs partial allocation when not enough drones available', async () => {
      const d1 = makeDrone('DR-0001');
      store.assets.set(d1.id, d1);

      const booking = makeBooking({
        show_date: '2026-06-01T10:00:00.000Z',
        end_date: '2026-06-01T14:00:00.000Z',
        drone_count: 5,
        status: 'pending',
      });
      store.bookings.set(booking.id, booking);

      const result = await allocationService.allocate(booking.id, ACTOR_ID);

      expect(result.allocated).toHaveLength(1);
      expect(result.shortfall).toBe(4);
      expect(result.alternatives).toBeDefined();
    });

    it('selects drones deterministically by serial number', async () => {
      // Insert in reverse order
      const d3 = makeDrone('DR-0003');
      const d1 = makeDrone('DR-0001');
      const d2 = makeDrone('DR-0002');
      store.assets.set(d3.id, d3);
      store.assets.set(d1.id, d1);
      store.assets.set(d2.id, d2);

      const booking = makeBooking({
        show_date: '2026-06-01T10:00:00.000Z',
        end_date: '2026-06-01T14:00:00.000Z',
        drone_count: 2,
        status: 'pending',
      });
      store.bookings.set(booking.id, booking);

      const result = await allocationService.allocate(booking.id, ACTOR_ID);

      expect(result.allocated[0]!.serial_number).toBe('DR-0001');
      expect(result.allocated[1]!.serial_number).toBe('DR-0002');
    });

    it('throws for non-pending bookings', async () => {
      const booking = makeBooking({ status: 'allocated' });
      store.bookings.set(booking.id, booking);

      await expect(
        allocationService.allocate(booking.id, ACTOR_ID),
      ).rejects.toThrow("Cannot allocate booking in 'allocated' status");
    });

    it('throws for nonexistent booking', async () => {
      await expect(
        allocationService.allocate('nonexistent', ACTOR_ID),
      ).rejects.toThrow('Booking not found');
    });

    it('creates audit events for each allocated drone', async () => {
      const d1 = makeDrone('DR-0001');
      store.assets.set(d1.id, d1);

      const booking = makeBooking({
        show_date: '2026-06-01T10:00:00.000Z',
        drone_count: 1,
        status: 'pending',
      });
      store.bookings.set(booking.id, booking);

      await allocationService.allocate(booking.id, ACTOR_ID);

      // Verify asset was updated in store (original object unchanged)
      expect(d1.status).toBe('available'); // original unchanged
      expect(store.assets.get(d1.id)!.status).toBe('allocated');
    });

    it('does not allocate drones already assigned to overlapping bookings', async () => {
      const d1 = makeDrone('DR-0001');
      const d2 = makeDrone('DR-0002');
      store.assets.set(d1.id, d1);
      store.assets.set(d2.id, d2);

      // Existing booking has d1 allocated for overlapping time
      const existing = makeBooking({
        show_date: '2026-06-01T08:00:00.000Z',
        end_date: '2026-06-01T12:00:00.000Z',
        status: 'allocated',
        allocated_assets: [d1.id],
        drone_count: 1,
      });
      store.bookings.set(existing.id, existing);

      const newBooking = makeBooking({
        show_date: '2026-06-01T10:00:00.000Z',
        end_date: '2026-06-01T14:00:00.000Z',
        drone_count: 1,
        status: 'pending',
      });
      store.bookings.set(newBooking.id, newBooking);

      const result = await allocationService.allocate(newBooking.id, ACTOR_ID);

      expect(result.allocated).toHaveLength(1);
      expect(result.allocated[0]!.id).toBe(d2.id);
    });
  });
});
