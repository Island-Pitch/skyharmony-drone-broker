import { describe, it, expect, beforeEach } from 'vitest';
import { BookingService } from '../BookingService';
import { InMemoryBookingRepository } from '@/data/repositories/InMemoryBookingRepository';
import { store } from '@/data/store';

describe('BookingService', () => {
  let service: BookingService;

  const validInput = {
    operator_id: crypto.randomUUID(),
    operator_name: 'SkyShow Events',
    show_date: '2026-05-01T20:00:00.000Z',
    drone_count: 100,
    location: 'Miami Beach, FL',
  };

  beforeEach(() => {
    store.reset();
    const repo = new InMemoryBookingRepository();
    service = new BookingService(repo);
  });

  describe('createBooking', () => {
    it('creates a booking with valid input', async () => {
      const booking = await service.createBooking(validInput);
      expect(booking.id).toBeDefined();
      expect(booking.status).toBe('pending');
      expect(booking.operator_name).toBe('SkyShow Events');
    });

    it('rejects invalid input (missing location)', async () => {
      await expect(
        service.createBooking({
          operator_id: crypto.randomUUID(),
          operator_name: 'Test',
          show_date: '2026-05-01T20:00:00.000Z',
          drone_count: 100,
        }),
      ).rejects.toThrow();
    });

    it('rejects non-positive drone_count', async () => {
      await expect(
        service.createBooking({ ...validInput, drone_count: 0 }),
      ).rejects.toThrow();
    });
  });

  describe('getBooking', () => {
    it('returns a booking by id', async () => {
      const created = await service.createBooking(validInput);
      const found = await service.getBooking(created.id);
      expect(found).toEqual(created);
    });

    it('returns undefined for non-existent id', async () => {
      const found = await service.getBooking(crypto.randomUUID());
      expect(found).toBeUndefined();
    });
  });

  describe('updateBooking', () => {
    it('updates booking fields', async () => {
      const created = await service.createBooking(validInput);
      const updated = await service.updateBooking(created.id, {
        drone_count: 200,
      });
      expect(updated.drone_count).toBe(200);
    });
  });

  describe('listBookings', () => {
    it('returns all bookings', async () => {
      await service.createBooking(validInput);
      await service.createBooking({
        ...validInput,
        operator_name: 'DroneLight Co',
      });
      const bookings = await service.listBookings();
      expect(bookings).toHaveLength(2);
    });
  });

  describe('listByOperator', () => {
    it('returns bookings for a specific operator', async () => {
      const opId = crypto.randomUUID();
      await service.createBooking({ ...validInput, operator_id: opId });
      await service.createBooking(validInput);
      const results = await service.listByOperator(opId);
      expect(results).toHaveLength(1);
    });
  });

  describe('transition', () => {
    it('transitions pending to allocated', async () => {
      const created = await service.createBooking(validInput);
      const updated = await service.transition(created.id, 'allocated');
      expect(updated.status).toBe('allocated');
    });

    it('transitions allocated to confirmed', async () => {
      const created = await service.createBooking(validInput);
      await service.transition(created.id, 'allocated');
      const updated = await service.transition(created.id, 'confirmed');
      expect(updated.status).toBe('confirmed');
    });

    it('transitions confirmed to completed', async () => {
      const created = await service.createBooking(validInput);
      await service.transition(created.id, 'allocated');
      await service.transition(created.id, 'confirmed');
      const updated = await service.transition(created.id, 'completed');
      expect(updated.status).toBe('completed');
    });

    it('allows cancellation from pending', async () => {
      const created = await service.createBooking(validInput);
      const updated = await service.transition(created.id, 'cancelled');
      expect(updated.status).toBe('cancelled');
    });

    it('rejects invalid transition (pending to confirmed)', async () => {
      const created = await service.createBooking(validInput);
      await expect(
        service.transition(created.id, 'confirmed'),
      ).rejects.toThrow('Invalid transition');
    });

    it('rejects transition from completed', async () => {
      const created = await service.createBooking(validInput);
      await service.transition(created.id, 'allocated');
      await service.transition(created.id, 'confirmed');
      await service.transition(created.id, 'completed');
      await expect(
        service.transition(created.id, 'pending'),
      ).rejects.toThrow('Invalid transition');
    });

    it('throws for non-existent booking', async () => {
      await expect(
        service.transition(crypto.randomUUID(), 'allocated'),
      ).rejects.toThrow('Booking not found');
    });
  });
});
