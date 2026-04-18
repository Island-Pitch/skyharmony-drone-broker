import { useState } from 'react';
import { useBookings } from '@/hooks/useBookings';
import { RouteGuard } from '@/auth/RouteGuard';
import { Permission } from '@/auth/roles';
import type { BookingStatusValue } from '@/data/models/booking';

type SortField = 'operator_name' | 'show_date' | 'drone_count' | 'location' | 'status';
type SortDir = 'asc' | 'desc';

function AdminBookingQueueInner() {
  const { bookings, loading, transitionBooking } = useBookings();
  const [sortField, setSortField] = useState<SortField>('show_date');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  }

  const sorted = [...bookings].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    let cmp = 0;
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      cmp = aVal - bVal;
    } else {
      cmp = String(aVal).localeCompare(String(bVal));
    }
    return sortDir === 'asc' ? cmp : -cmp;
  });

  async function handleTransition(id: string, newStatus: BookingStatusValue) {
    try {
      await transitionBooking(id, newStatus);
    } catch {
      // Error is shown via the hook's error state if needed
    }
  }

  if (loading) {
    return (
      <div className="page">
        <h2>Booking Queue</h2>
        <p>Loading...</p>
      </div>
    );
  }

  const sortIndicator = (field: SortField) =>
    sortField === field ? (sortDir === 'asc' ? ' \u2191' : ' \u2193') : '';

  return (
    <div className="page">
      <h2>Booking Queue</h2>
      {bookings.length === 0 ? (
        <p>No bookings in the queue.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th
                onClick={() => handleSort('operator_name')}
                style={{ cursor: 'pointer' }}
              >
                Operator{sortIndicator('operator_name')}
              </th>
              <th
                onClick={() => handleSort('show_date')}
                style={{ cursor: 'pointer' }}
              >
                Show Date{sortIndicator('show_date')}
              </th>
              <th
                onClick={() => handleSort('drone_count')}
                style={{ cursor: 'pointer' }}
              >
                Drones{sortIndicator('drone_count')}
              </th>
              <th
                onClick={() => handleSort('location')}
                style={{ cursor: 'pointer' }}
              >
                Location{sortIndicator('location')}
              </th>
              <th
                onClick={() => handleSort('status')}
                style={{ cursor: 'pointer' }}
              >
                Status{sortIndicator('status')}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((booking) => (
              <tr key={booking.id}>
                <td>{booking.operator_name}</td>
                <td>{new Date(booking.show_date).toLocaleDateString()}</td>
                <td>{booking.drone_count}</td>
                <td>{booking.location}</td>
                <td>
                  <span className={`status-badge ${booking.status}`}>
                    {booking.status}
                  </span>
                </td>
                <td>
                  {booking.status === 'pending' && (
                    <button
                      className="btn-primary"
                      onClick={() => handleTransition(booking.id, 'allocated')}
                    >
                      Approve
                    </button>
                  )}
                  {booking.status === 'allocated' && (
                    <button
                      className="btn-primary"
                      onClick={() => handleTransition(booking.id, 'confirmed')}
                    >
                      Confirm
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export function AdminBookingQueue() {
  return (
    <RouteGuard permission={Permission.BookingApprove}>
      <AdminBookingQueueInner />
    </RouteGuard>
  );
}
