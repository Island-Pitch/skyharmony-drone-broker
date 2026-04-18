import { useEffect, useState } from 'react';
import { useBookings } from '@/hooks/useBookings';
import { useAllocation } from '@/hooks/useAllocation';
import { RouteGuard } from '@/auth/RouteGuard';
import { Permission } from '@/auth/roles';

/** Mock actor ID — in production this comes from the auth context. */
const SYSTEM_ACTOR_ID = '00000000-0000-4000-9000-000000000001';

function AllocationPanelInner() {
  const { bookings, loading: bookingsLoading, refreshBookings } = useBookings();
  const {
    available,
    allocationResult,
    loading: allocLoading,
    error,
    checkAvailability,
    allocate,
  } = useAllocation();

  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  const pendingBookings = bookings.filter((b) => b.status === 'pending');
  const selectedBooking = pendingBookings.find((b) => b.id === selectedBookingId) ?? null;

  // Check availability when a booking is selected
  useEffect(() => {
    if (selectedBooking) {
      checkAvailability(selectedBooking.show_date, selectedBooking.end_date);
    }
  }, [selectedBooking, checkAvailability]);

  async function handleAllocate() {
    if (!selectedBookingId) return;
    try {
      await allocate(selectedBookingId, SYSTEM_ACTOR_ID);
      setSelectedBookingId(null);
      await refreshBookings();
    } catch {
      // Error is captured in the hook
    }
  }

  if (bookingsLoading) {
    return (
      <div className="page">
        <h2>Allocation Engine</h2>
        <p>Loading bookings...</p>
      </div>
    );
  }

  return (
    <div className="page">
      <h2>Allocation Engine</h2>

      {pendingBookings.length === 0 ? (
        <p>No pending bookings to allocate.</p>
      ) : (
        <>
          <h3>Pending Bookings</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Operator</th>
                <th>Show Date</th>
                <th>Drones Requested</th>
                <th>Location</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingBookings.map((booking) => (
                <tr
                  key={booking.id}
                  style={
                    selectedBookingId === booking.id
                      ? { background: 'var(--color-surface-hover, #f0f0f0)' }
                      : undefined
                  }
                >
                  <td>{booking.operator_name}</td>
                  <td>{new Date(booking.show_date).toLocaleDateString()}</td>
                  <td>{booking.drone_count}</td>
                  <td>{booking.location}</td>
                  <td>
                    <button
                      className="btn-primary"
                      onClick={() => setSelectedBookingId(booking.id)}
                    >
                      Select
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {selectedBooking && (
        <div style={{ marginTop: '1.5rem' }}>
          <h3>Allocation Preview</h3>
          <p>
            <strong>Booking:</strong> {selectedBooking.operator_name} —{' '}
            {selectedBooking.location}
          </p>
          <p>
            <strong>Drones requested:</strong> {selectedBooking.drone_count}
          </p>
          <p>
            <strong>Available drones for date:</strong>{' '}
            {allocLoading ? 'Checking...' : available.length}
          </p>

          {!allocLoading && available.length < selectedBooking.drone_count && (
            <p className="status-badge maintenance" role="alert">
              Warning: Only {available.length} drones available — shortfall of{' '}
              {selectedBooking.drone_count - available.length}
            </p>
          )}

          <button
            className="btn-primary"
            onClick={handleAllocate}
            disabled={allocLoading || available.length === 0}
          >
            {allocLoading ? 'Allocating...' : 'Allocate Drones'}
          </button>
        </div>
      )}

      {allocationResult && (
        <div style={{ marginTop: '1.5rem' }} role="status">
          <h3>Allocation Result</h3>
          <p>
            <strong>Drones allocated:</strong> {allocationResult.allocated.length}
          </p>
          {allocationResult.shortfall > 0 && (
            <p>
              <strong>Shortfall:</strong> {allocationResult.shortfall} drones
              still needed
            </p>
          )}
          {allocationResult.alternatives &&
            allocationResult.alternatives.length > 0 && (
              <div>
                <h4>Alternative Dates</h4>
                <ul>
                  {allocationResult.alternatives.map((alt) => (
                    <li key={alt.date}>
                      {new Date(alt.date).toLocaleDateString()} —{' '}
                      {alt.availableCount} drones available
                    </li>
                  ))}
                </ul>
              </div>
            )}
        </div>
      )}

      {error && (
        <p role="alert" style={{ color: 'var(--color-danger, red)' }}>
          Error: {error.message}
        </p>
      )}
    </div>
  );
}

export function AllocationPanel() {
  return (
    <RouteGuard permission={Permission.AssetAllocate}>
      <AllocationPanelInner />
    </RouteGuard>
  );
}
