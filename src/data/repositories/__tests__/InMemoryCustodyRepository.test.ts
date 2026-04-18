import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryCustodyRepository } from '../InMemoryCustodyRepository';
import { store } from '@/data/store';

describe('InMemoryCustodyRepository', () => {
  let repo: InMemoryCustodyRepository;
  const assetId = crypto.randomUUID();
  const actorId = crypto.randomUUID();
  const bookingId = crypto.randomUUID();

  beforeEach(() => {
    store.reset();
    repo = new InMemoryCustodyRepository();
  });

  it('creates a custody event with generated id and timestamp', async () => {
    const event = await repo.create({
      asset_id: assetId,
      action: 'check_out',
      actor_id: actorId,
    });

    expect(event.id).toBeDefined();
    expect(event.timestamp).toBeDefined();
    expect(event.asset_id).toBe(assetId);
    expect(event.action).toBe('check_out');
    expect(event.actor_id).toBe(actorId);
  });

  it('stores the event in the global store', async () => {
    const event = await repo.create({
      asset_id: assetId,
      action: 'check_out',
      actor_id: actorId,
    });

    expect(store.custodyEvents.get(event.id)).toEqual(event);
  });

  it('finds events by asset id', async () => {
    const otherId = crypto.randomUUID();

    await repo.create({ asset_id: assetId, action: 'check_out', actor_id: actorId });
    await repo.create({ asset_id: assetId, action: 'check_in', actor_id: actorId });
    await repo.create({ asset_id: otherId, action: 'check_out', actor_id: actorId });

    const events = await repo.findByAssetId(assetId);
    expect(events).toHaveLength(2);
    expect(events.every((e) => e.asset_id === assetId)).toBe(true);
  });

  it('finds events by booking id', async () => {
    await repo.create({
      asset_id: assetId,
      action: 'check_out',
      actor_id: actorId,
      booking_id: bookingId,
    });
    await repo.create({
      asset_id: crypto.randomUUID(),
      action: 'check_out',
      actor_id: actorId,
      booking_id: bookingId,
    });
    await repo.create({
      asset_id: crypto.randomUUID(),
      action: 'check_out',
      actor_id: actorId,
    });

    const events = await repo.findByBookingId(bookingId);
    expect(events).toHaveLength(2);
    expect(events.every((e) => e.booking_id === bookingId)).toBe(true);
  });

  it('returns all events', async () => {
    await repo.create({ asset_id: assetId, action: 'check_out', actor_id: actorId });
    await repo.create({ asset_id: crypto.randomUUID(), action: 'check_in', actor_id: actorId });

    const all = await repo.findAll();
    expect(all).toHaveLength(2);
  });

  it('resets clears all events', async () => {
    await repo.create({ asset_id: assetId, action: 'check_out', actor_id: actorId });
    repo.reset();

    const all = await repo.findAll();
    expect(all).toHaveLength(0);
  });
});
