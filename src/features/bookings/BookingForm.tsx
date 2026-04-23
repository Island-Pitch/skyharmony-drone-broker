import { useState, type FormEvent } from 'react';
import { useBookings } from '@/hooks/useBookings';
import { useAuth } from '@/auth/useAuth';
import { RouteGuard } from '@/auth/RouteGuard';
import { Permission } from '@/auth/roles';
import posthog from '@/lib/posthog';

interface FormState {
  show_date: string;
  end_date: string;
  drone_count: string;
  location: string;
  notes: string;
}

const initialFormState: FormState = {
  show_date: '',
  end_date: '',
  drone_count: '',
  location: '',
  notes: '',
};

function BookingFormInner() {
  const { createBooking } = useBookings();
  const { user } = useAuth();
  const [form, setForm] = useState<FormState>(initialFormState);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [confirmationId, setConfirmationId] = useState<string | null>(null);

  function validate(): Partial<Record<keyof FormState, string>> {
    const newErrors: Partial<Record<keyof FormState, string>> = {};
    if (!form.show_date) newErrors.show_date = 'Show date is required';
    if (!form.drone_count || Number(form.drone_count) < 1) {
      newErrors.drone_count = 'Drone count must be at least 1';
    }
    if (!Number.isInteger(Number(form.drone_count))) {
      newErrors.drone_count = 'Drone count must be a whole number';
    }
    if (!form.location.trim()) newErrors.location = 'Location is required';
    setErrors(newErrors);
    return newErrors;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      posthog.capture('booking_form_validation_error', {
        missing_fields: Object.keys(validationErrors),
      });
      return;
    }

    setSubmitting(true);
    try {
      const showDateISO = new Date(form.show_date).toISOString();
      const endDateISO = form.end_date ? new Date(form.end_date).toISOString() : undefined;

      const booking = await createBooking({
        operator_id: user.id,
        operator_name: user.name,
        show_date: showDateISO,
        end_date: endDateISO,
        drone_count: Number(form.drone_count),
        location: form.location.trim(),
        notes: form.notes.trim() || undefined,
      });
      posthog.capture('booking_form_submitted', {
        booking_id: booking.id,
        drone_count: Number(form.drone_count),
        location: form.location.trim(),
      });
      setConfirmationId(booking.id);
      setForm(initialFormState);
      setErrors({});
    } catch (err) {
      posthog.captureException(err);
      setErrors({ show_date: 'Failed to create booking. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmationId) {
    return (
      <div className="page">
        <div className="stat-card" data-testid="booking-confirmation">
          <h3>Booking Submitted</h3>
          <p>Your booking request has been submitted successfully.</p>
          <p>
            Reference: <strong>{confirmationId.slice(0, 8).toUpperCase()}</strong>
          </p>
          <button
            className="btn-primary"
            onClick={() => setConfirmationId(null)}
            style={{ marginTop: '1rem' }}
          >
            Create Another Booking
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <h2>New Booking Request</h2>
      <form onSubmit={handleSubmit} data-testid="booking-form">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '500px' }}>
          <div>
            <label htmlFor="show_date">Show Date *</label>
            <input
              id="show_date"
              type="datetime-local"
              value={form.show_date}
              onChange={(e) => setForm((f) => ({ ...f, show_date: e.target.value }))}
              style={{ display: 'block', width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
            />
            {errors.show_date && <span className="field-error" role="alert">{errors.show_date}</span>}
          </div>

          <div>
            <label htmlFor="end_date">End Date</label>
            <input
              id="end_date"
              type="datetime-local"
              value={form.end_date}
              onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
              style={{ display: 'block', width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
            />
          </div>

          <div>
            <label htmlFor="drone_count">Number of Drones *</label>
            <input
              id="drone_count"
              type="number"
              min="1"
              value={form.drone_count}
              onChange={(e) => setForm((f) => ({ ...f, drone_count: e.target.value }))}
              style={{ display: 'block', width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
            />
            {errors.drone_count && <span className="field-error" role="alert">{errors.drone_count}</span>}
          </div>

          <div>
            <label htmlFor="location">Location *</label>
            <input
              id="location"
              type="text"
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              placeholder="e.g. Miami Beach, FL"
              style={{ display: 'block', width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
            />
            {errors.location && <span className="field-error" role="alert">{errors.location}</span>}
          </div>

          <div>
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={3}
              placeholder="Any special requirements..."
              style={{ display: 'block', width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
            />
          </div>

          <button className="btn-primary" type="submit" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Booking Request'}
          </button>
        </div>
      </form>
    </div>
  );
}

export function BookingForm() {
  return (
    <RouteGuard permission={Permission.BookingCreate}>
      <BookingFormInner />
    </RouteGuard>
  );
}
