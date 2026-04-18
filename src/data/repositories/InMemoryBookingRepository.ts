import type {
  Booking,
  BookingStatusValue,
  CreateBookingInput,
  UpdateBookingInput,
} from '../models/booking';
import { store } from '../store';

/** Repository contract for booking persistence. */
export interface IBookingRepository {
  findById(id: string): Promise<Booking | undefined>;
  findAll(): Promise<Booking[]>;
  create(input: CreateBookingInput): Promise<Booking>;
  update(id: string, input: UpdateBookingInput): Promise<Booking>;
  delete(id: string): Promise<void>;
  findByOperator(operatorId: string): Promise<Booking[]>;
  findByStatus(status: BookingStatusValue): Promise<Booking[]>;
}

export class InMemoryBookingRepository implements IBookingRepository {
  async create(input: CreateBookingInput): Promise<Booking> {
    const now = new Date().toISOString();
    const booking: Booking = {
      id: crypto.randomUUID(),
      operator_id: input.operator_id,
      operator_name: input.operator_name,
      show_date: input.show_date,
      end_date: input.end_date,
      drone_count: input.drone_count,
      location: input.location,
      status: 'pending',
      notes: input.notes,
      allocated_assets: [],
      requested_assets: input.requested_assets ?? [],
      created_at: now,
      updated_at: now,
    };
    store.bookings.set(booking.id, booking);
    return booking;
  }

  async findById(id: string): Promise<Booking | undefined> {
    return store.bookings.get(id);
  }

  async findAll(): Promise<Booking[]> {
    return Array.from(store.bookings.values());
  }

  async update(id: string, input: UpdateBookingInput): Promise<Booking> {
    const existing = store.bookings.get(id);
    if (!existing) {
      throw new Error(`Booking not found: ${id}`);
    }

    const updated: Booking = {
      ...existing,
      ...Object.fromEntries(
        Object.entries(input).filter(([, v]) => v !== undefined),
      ),
      updated_at: new Date().toISOString(),
    };

    store.bookings.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    if (!store.bookings.has(id)) {
      throw new Error(`Booking not found: ${id}`);
    }
    store.bookings.delete(id);
  }

  async findByOperator(operatorId: string): Promise<Booking[]> {
    return Array.from(store.bookings.values()).filter(
      (b) => b.operator_id === operatorId,
    );
  }

  async findByStatus(status: BookingStatusValue): Promise<Booking[]> {
    return Array.from(store.bookings.values()).filter(
      (b) => b.status === status,
    );
  }
}
