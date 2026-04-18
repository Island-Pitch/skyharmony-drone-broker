import type { Booking, CreateBookingInput, UpdateBookingInput, BookingStatusValue } from '../../models/booking';
import type { IBookingRepository } from '../InMemoryBookingRepository';
import { apiGet, apiPost, apiPatch } from './apiClient';

export class HttpBookingRepository implements IBookingRepository {
  async findById(id: string): Promise<Booking | undefined> {
    try {
      const res = await apiGet<Booking>(`/bookings/${id}`);
      return res.data;
    } catch {
      return undefined;
    }
  }

  async findAll(): Promise<Booking[]> {
    const res = await apiGet<Booking[]>('/bookings');
    return res.data;
  }

  async create(input: CreateBookingInput): Promise<Booking> {
    const res = await apiPost<Booking>('/bookings', input);
    return res.data;
  }

  async update(id: string, input: UpdateBookingInput): Promise<Booking> {
    const res = await apiPatch<Booking>(`/bookings/${id}`, input);
    return res.data;
  }

  async delete(id: string): Promise<void> {
    await apiPost(`/bookings/${id}/transition`, { status: 'cancelled' });
  }

  async findByOperator(operatorId: string): Promise<Booking[]> {
    const all = await this.findAll();
    return all.filter((b) => b.operator_id === operatorId);
  }

  async findByStatus(status: BookingStatusValue): Promise<Booking[]> {
    const all = await this.findAll();
    return all.filter((b) => b.status === status);
  }
}
