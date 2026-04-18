import type { CustodyEvent } from '../../models/custody';
import type { ICustodyRepository } from '../InMemoryCustodyRepository';
import { apiPost } from './apiClient';

export class HttpCustodyRepository implements ICustodyRepository {
  async create(input: Omit<CustodyEvent, 'id' | 'timestamp'>): Promise<CustodyEvent> {
    // Custody events are created via /api/scan/checkout and /api/scan/checkin
    const res = await apiPost<CustodyEvent>('/scan/checkout', {
      serial_number: input.asset_id, // Server resolves by serial
      booking_id: input.booking_id,
    });
    return res.data;
  }

  async findByAssetId(): Promise<CustodyEvent[]> {
    return [];
  }

  async findByBookingId(): Promise<CustodyEvent[]> {
    return [];
  }

  async findAll(): Promise<CustodyEvent[]> {
    return [];
  }

  reset(): void {
    // No-op
  }
}
