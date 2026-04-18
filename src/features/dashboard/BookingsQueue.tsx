import { useState, useMemo } from 'react';
import { useBookings } from '@/hooks/useBookings';
import type { Booking } from '@/data/models/booking';

type SortField = 'show_date' | 'operator_name' | 'drone_count' | 'status';
type SortDirection = 'asc' | 'desc';

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'pending': return 'status-badge idle';
    case 'allocated': return 'status-badge active';
    case 'confirmed': return 'status-badge active';
    case 'completed': return 'status-badge maintenance';
    case 'cancelled': return 'status-badge maintenance';
    default: return 'status-badge';
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Sortable table of active bookings for the admin dashboard. */
export function BookingsQueue() {
  const { bookings, loading } = useBookings();
  const [sortField, setSortField] = useState<SortField>('show_date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const activeBookings = useMemo(() => {
    return bookings.filter(
      (b) => b.status !== 'completed' && b.status !== 'cancelled',
    );
  }, [bookings]);

  const sortedBookings = useMemo(() => {
    const sorted = [...activeBookings];
    sorted.sort((a: Booking, b: Booking) => {
      let cmp = 0;
      switch (sortField) {
        case 'show_date':
          cmp = a.show_date.localeCompare(b.show_date);
          break;
        case 'operator_name':
          cmp = a.operator_name.localeCompare(b.operator_name);
          break;
        case 'drone_count':
          cmp = a.drone_count - b.drone_count;
          break;
        case 'status':
          cmp = a.status.localeCompare(b.status);
          break;
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, [activeBookings, sortField, sortDirection]);

  function handleSort(field: SortField) {
    if (field === sortField) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }

  function sortIndicator(field: SortField): string {
    if (field !== sortField) return '';
    return sortDirection === 'asc' ? ' \u25B2' : ' \u25BC';
  }

  if (loading) {
    return <p>Loading bookings...</p>;
  }

  return (
    <div className="dashboard-widget" data-testid="bookings-queue">
      <h3>Active Bookings ({activeBookings.length})</h3>
      {activeBookings.length === 0 ? (
        <p className="empty-state">No active bookings</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('operator_name')} style={{ cursor: 'pointer' }}>
                Operator{sortIndicator('operator_name')}
              </th>
              <th onClick={() => handleSort('show_date')} style={{ cursor: 'pointer' }}>
                Show Date{sortIndicator('show_date')}
              </th>
              <th>Location</th>
              <th onClick={() => handleSort('drone_count')} style={{ cursor: 'pointer' }}>
                Drones{sortIndicator('drone_count')}
              </th>
              <th onClick={() => handleSort('status')} style={{ cursor: 'pointer' }}>
                Status{sortIndicator('status')}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedBookings.map((booking) => (
              <tr key={booking.id}>
                <td>{booking.operator_name}</td>
                <td>{formatDate(booking.show_date)}</td>
                <td>{booking.location}</td>
                <td>{booking.drone_count}</td>
                <td>
                  <span className={statusBadgeClass(booking.status)}>
                    {booking.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
