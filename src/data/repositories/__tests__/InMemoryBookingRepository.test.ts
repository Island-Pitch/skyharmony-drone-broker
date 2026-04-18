import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryBookingRepository } from '../InMemoryBookingRepository';
import { store } from '@/data/store';

describe('InMemoryBookingRepository', () => {
  let repo: InMemoryBookingRepository;

  const validInput = {
    operator_id: crypto.randomUUID(),
    operator_name: 'SkyShow Events',
    show_date: '2026-05-01T20:00:00.000Z',
    drone_count: 100,
    location: 'Miami Beach, FL',
  };

  beforeEach(() => {
    store.reset();
    repo = new InMemoryBookingRepository();
  });

  describe('create', () => {
    it('creates a booking with pending status', async () => {
      const booking = await repo.create(validInput);
      expect(booking.id).toBeDefined();
      expect(booking.status).toBe('pending');
      expect(booking.operator_name).toBe('SkyShow Events');
      expect(booking.allocated_assets).toEqual([]);
    });
  });

  describe('findById', () => {
    it('returns a booking by id', async () => {
      const created = await repo.create(validInput);
      const found = await repo.findById(created.id);
      expect(found).toEqual(created);
    });

    it('returns undefined for non-existent id', async () => {
      const found = await repo.findById(crypto.randomUUID());
      expect(found).toBeUndefined();
    });
  });

  describe('findAll', () => {
    it('returns all bookings', async () => {
      await repo.create(validInput);
      await repo.create({ ...validInput, operator_name: 'DroneLight Co' });
      const all = await repo.findAll();
      expect(all).toHaveLength(2);
    });
  });

  describe('update', () => {
    it('updates booking fields', async () => {
      const created = await repo.create(validInput);
      const updated = await repo.update(created.id, { drone_count: 200 });
      expect(updated.drone_count).toBe(200);
    });

    it('throws for non-existent booking', async () => {
      await expect(
        repo.update(crypto.randomUUID(), { drone_count: 200 }),
      ).rejects.toThrow('Booking not found');
    });
  });

  describe('delete', () => {
    it('deletes a booking', async () => {
      const created = await repo.create(validInput);
      await repo.delete(created.id);
      const found = await repo.findById(created.id);
      expect(found).toBeUndefined();
    });

    it('throws for non-existent booking', async () => {
      await expect(repo.delete(crypto.randomUUID())).rejects.toThrow(
        'Booking not found',
      );
    });
  });

  describe('findByOperator', () => {
    it('filters bookings by operator_id', async () => {
      const opId = crypto.randomUUID();
      await repo.create({ ...validInput, operator_id: opId });
      await repo.create({ ...validInput, operator_id: crypto.randomUUID() });
      const results = await repo.findByOperator(opId);
      expect(results).toHaveLength(1);
      expect(results[0]!.operator_id).toBe(opId);
    });
  });

  describe('findByStatus', () => {
    it('filters bookings by status', async () => {
      const b1 = await repo.create(validInput);
      await repo.create(validInput);
      await repo.update(b1.id, { status: 'allocated' });
      const pending = await repo.findByStatus('pending');
      expect(pending).toHaveLength(1);
      const allocated = await repo.findByStatus('allocated');
      expect(allocated).toHaveLength(1);
    });
  });
});
