import { useState } from 'react';
import { useAuth } from '@/auth/useAuth';
import { Permission } from '@/auth/roles';
import { BookingForm } from './BookingForm';
import { MyBookings } from './MyBookings';
import { AdminBookingQueue } from './AdminBookingQueue';

type Tab = 'form' | 'mine' | 'admin';

export function Bookings() {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission(Permission.BookingCreate);
  const canApprove = hasPermission(Permission.BookingApprove);

  const defaultTab: Tab = canCreate ? 'form' : 'mine';
  const [activeTab, setActiveTab] = useState<Tab>(defaultTab);

  return (
    <div className="page">
      <h2>Bookings</h2>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {canCreate && (
          <button
            className={`btn-primary${activeTab === 'form' ? '' : ' btn-secondary'}`}
            onClick={() => setActiveTab('form')}
            style={activeTab !== 'form' ? { background: 'var(--color-surface)', color: 'var(--color-text)' } : undefined}
          >
            New Booking
          </button>
        )}
        <button
          className={`btn-primary${activeTab === 'mine' ? '' : ' btn-secondary'}`}
          onClick={() => setActiveTab('mine')}
          style={activeTab !== 'mine' ? { background: 'var(--color-surface)', color: 'var(--color-text)' } : undefined}
        >
          My Bookings
        </button>
        {canApprove && (
          <button
            className={`btn-primary${activeTab === 'admin' ? '' : ' btn-secondary'}`}
            onClick={() => setActiveTab('admin')}
            style={activeTab !== 'admin' ? { background: 'var(--color-surface)', color: 'var(--color-text)' } : undefined}
          >
            Admin Queue
          </button>
        )}
      </div>

      {activeTab === 'form' && <BookingForm />}
      {activeTab === 'mine' && <MyBookings />}
      {activeTab === 'admin' && <AdminBookingQueue />}
    </div>
  );
}
