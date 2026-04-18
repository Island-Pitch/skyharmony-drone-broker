import { useState, useEffect, useCallback, useContext } from 'react';
import { DataContext } from '@/providers/DataProvider';
import type { Booking, CreateBookingInput, UpdateBookingInput, BookingStatusValue } from '@/data/models/booking';

/** Hook providing booking CRUD operations with loading/error states. Reads from DataProvider context. */
export function useBookings() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useBookings must be used within a DataProvider');

  const { bookingService } = ctx;
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refreshBookings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await bookingService.listBookings();
      setBookings(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setLoading(false);
    }
  }, [bookingService]);

  useEffect(() => {
    refreshBookings();
  }, [refreshBookings]);

  const createBooking = useCallback(
    async (input: CreateBookingInput) => {
      const created = await bookingService.createBooking(input);
      await refreshBookings();
      return created;
    },
    [bookingService, refreshBookings],
  );

  const updateBooking = useCallback(
    async (id: string, input: UpdateBookingInput) => {
      const updated = await bookingService.updateBooking(id, input);
      await refreshBookings();
      return updated;
    },
    [bookingService, refreshBookings],
  );

  const transitionBooking = useCallback(
    async (id: string, newStatus: BookingStatusValue) => {
      const updated = await bookingService.transition(id, newStatus);
      await refreshBookings();
      return updated;
    },
    [bookingService, refreshBookings],
  );

  return { bookings, loading, error, createBooking, updateBooking, transitionBooking, refreshBookings };
}
