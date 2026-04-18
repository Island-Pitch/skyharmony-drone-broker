import type { Booking, BookingStatusValue } from '@/data/models/booking';
import { CreateBookingInputSchema, UpdateBookingInputSchema } from '@/data/models/booking';
import type { IBookingRepository } from '@/data/repositories/InMemoryBookingRepository';

/** Valid status transitions for the booking state machine. */
const VALID_TRANSITIONS: Record<BookingStatusValue, BookingStatusValue[]> = {
  pending: ['allocated', 'cancelled'],
  allocated: ['confirmed', 'cancelled'],
  confirmed: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

/** Service layer for booking CRUD. Validates input with Zod before delegating to the repository. */
export class BookingService {
  constructor(private readonly bookingRepo: IBookingRepository) {}

  async createBooking(input: unknown): Promise<Booking> {
    const validated = CreateBookingInputSchema.parse(input);
    return this.bookingRepo.create(validated);
  }

  async getBooking(id: string): Promise<Booking | undefined> {
    return this.bookingRepo.findById(id);
  }

  async updateBooking(id: string, input: unknown): Promise<Booking> {
    const validated = UpdateBookingInputSchema.parse(input);
    return this.bookingRepo.update(id, validated);
  }

  async listBookings(): Promise<Booking[]> {
    return this.bookingRepo.findAll();
  }

  async listByOperator(operatorId: string): Promise<Booking[]> {
    return this.bookingRepo.findByOperator(operatorId);
  }

  async listByStatus(status: BookingStatusValue): Promise<Booking[]> {
    return this.bookingRepo.findByStatus(status);
  }

  async transition(id: string, newStatus: BookingStatusValue): Promise<Booking> {
    const booking = await this.bookingRepo.findById(id);
    if (!booking) {
      throw new Error(`Booking not found: ${id}`);
    }

    const allowed = VALID_TRANSITIONS[booking.status];
    if (!allowed.includes(newStatus)) {
      throw new Error(
        `Invalid transition: cannot move from '${booking.status}' to '${newStatus}'`,
      );
    }

    return this.bookingRepo.update(id, { status: newStatus });
  }
}
