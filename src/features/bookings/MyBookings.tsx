import { useBookings } from '@/hooks/useBookings';
import { useAuth } from '@/auth/useAuth';

export function MyBookings() {
  const { bookings, loading } = useBookings();
  const { user } = useAuth();

  const myBookings = bookings
    .filter((b) => b.operator_id === user.id)
    .sort((a, b) => new Date(a.show_date).getTime() - new Date(b.show_date).getTime());

  if (loading) {
    return (
      <div className="page">
        <h2>My Bookings</h2>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="page">
      <h2>My Bookings</h2>
      {myBookings.length === 0 ? (
        <p>No bookings found. Create a new booking request to get started.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Reference</th>
              <th>Show Date</th>
              <th>Drones</th>
              <th>Location</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {myBookings.map((booking) => (
              <tr key={booking.id}>
                <td>{booking.id.slice(0, 8).toUpperCase()}</td>
                <td>{new Date(booking.show_date).toLocaleDateString()}</td>
                <td>{booking.drone_count}</td>
                <td>{booking.location}</td>
                <td>
                  <span className={`status-badge ${booking.status}`}>
                    {booking.status}
                  </span>
                </td>
                <td>{new Date(booking.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
