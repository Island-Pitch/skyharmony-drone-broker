import { useState, type FormEvent } from 'react';
import { useBookings } from '@/hooks/useBookings';
import { useAuth } from '@/auth/useAuth';
import { RouteGuard } from '@/auth/RouteGuard';
import { Permission } from '@/auth/roles';
import type { RequestedAsset } from '@/data/models/booking';

/** Well-known asset type IDs matching the seed data. */
const ASSET_TYPE_IDS = {
  trailer: '00000000-0000-4000-8000-000000000005',
  rtk_station: '00000000-0000-4000-8000-000000000008',
  ground_control: '00000000-0000-4000-8000-000000000007',
} as const;

interface EquipmentState {
  trailers: string;
  rtk_stations: string;
  ground_control: string;
}

interface FormState {
  show_date: string;
  end_date: string;
  drone_count: string;
  location: string;
  notes: string;
  equipment: EquipmentState;
}

const initialFormState: FormState = {
  show_date: '',
  end_date: '',
  drone_count: '',
  location: '',
  notes: '',
  equipment: { trailers: '', rtk_stations: '', ground_control: '' },
};

function BookingFormInner() {
  const { createBooking } = useBookings();
  const { user } = useAuth();
  const [form, setForm] = useState<FormState>(initialFormState);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [confirmationId, setConfirmationId] = useState<string | null>(null);

  function validate(): boolean {
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
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const showDateISO = new Date(form.show_date).toISOString();
      const endDateISO = form.end_date ? new Date(form.end_date).toISOString() : undefined;

      // Build requested_assets from optional equipment fields
      const extraAssets: RequestedAsset[] = [];
      const trailerCount = Number(form.equipment.trailers) || 0;
      const rtkCount = Number(form.equipment.rtk_stations) || 0;
      const gcCount = Number(form.equipment.ground_control) || 0;
      if (trailerCount > 0) extraAssets.push({ asset_type_id: ASSET_TYPE_IDS.trailer, count: trailerCount });
      if (rtkCount > 0) extraAssets.push({ asset_type_id: ASSET_TYPE_IDS.rtk_station, count: rtkCount });
      if (gcCount > 0) extraAssets.push({ asset_type_id: ASSET_TYPE_IDS.ground_control, count: gcCount });

      const booking = await createBooking({
        operator_id: user.id,
        operator_name: user.name,
        show_date: showDateISO,
        end_date: endDateISO,
        drone_count: Number(form.drone_count),
        location: form.location.trim(),
        notes: form.notes.trim() || undefined,
        requested_assets: extraAssets.length > 0 ? extraAssets : undefined,
      });
      setConfirmationId(booking.id);
      setForm(initialFormState);
      setErrors({});
    } catch {
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

          <fieldset style={{ border: '1px solid var(--color-border, #ccc)', borderRadius: '0.5rem', padding: '1rem', margin: 0 }}>
            <legend style={{ fontWeight: 600 }}>Additional Equipment (optional)</legend>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label htmlFor="trailers">Trailers</label>
                <input
                  id="trailers"
                  type="number"
                  min="0"
                  value={form.equipment.trailers}
                  onChange={(e) => setForm((f) => ({ ...f, equipment: { ...f.equipment, trailers: e.target.value } }))}
                  placeholder="0"
                  style={{ display: 'block', width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                />
              </div>
              <div>
                <label htmlFor="rtk_stations">RTK Stations</label>
                <input
                  id="rtk_stations"
                  type="number"
                  min="0"
                  value={form.equipment.rtk_stations}
                  onChange={(e) => setForm((f) => ({ ...f, equipment: { ...f.equipment, rtk_stations: e.target.value } }))}
                  placeholder="0"
                  style={{ display: 'block', width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                />
              </div>
              <div>
                <label htmlFor="ground_control">Ground Control Stations</label>
                <input
                  id="ground_control"
                  type="number"
                  min="0"
                  value={form.equipment.ground_control}
                  onChange={(e) => setForm((f) => ({ ...f, equipment: { ...f.equipment, ground_control: e.target.value } }))}
                  placeholder="0"
                  style={{ display: 'block', width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                />
              </div>
            </div>
          </fieldset>

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
