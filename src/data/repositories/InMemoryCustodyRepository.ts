import type { CustodyEvent } from '../models/custody';
import { store } from '../store';

export interface ICustodyRepository {
  create(input: Omit<CustodyEvent, 'id' | 'timestamp'>): Promise<CustodyEvent>;
  findByAssetId(assetId: string): Promise<CustodyEvent[]>;
  findByBookingId(bookingId: string): Promise<CustodyEvent[]>;
  findAll(): Promise<CustodyEvent[]>;
  reset(): void;
}

export class InMemoryCustodyRepository implements ICustodyRepository {
  async create(input: Omit<CustodyEvent, 'id' | 'timestamp'>): Promise<CustodyEvent> {
    const event: CustodyEvent = {
      ...input,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };
    store.custodyEvents.set(event.id, event);
    return event;
  }

  async findByAssetId(assetId: string): Promise<CustodyEvent[]> {
    return Array.from(store.custodyEvents.values())
      .filter((e) => e.asset_id === assetId)
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }

  async findByBookingId(bookingId: string): Promise<CustodyEvent[]> {
    return Array.from(store.custodyEvents.values())
      .filter((e) => e.booking_id === bookingId)
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }

  async findAll(): Promise<CustodyEvent[]> {
    return Array.from(store.custodyEvents.values());
  }

  reset(): void {
    store.custodyEvents.clear();
  }
}
