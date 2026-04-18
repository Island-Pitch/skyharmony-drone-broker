import { useState, useCallback } from 'react';
import { useSponsors } from '@/hooks/useSponsors';
import { useBookings } from '@/hooks/useBookings';
import type { SponsorReport } from '@/hooks/useSponsors';

function SponsorInitials({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 48,
        height: 48,
        borderRadius: '50%',
        backgroundColor: 'var(--color-accent, #D4A843)',
        color: '#1a1a2e',
        fontWeight: 700,
        fontSize: '1.1rem',
        fontFamily: 'Georgia, serif',
        flexShrink: 0,
      }}
    >
      {initials}
    </span>
  );
}

function CampaignBadge({ tag }: { tag: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '0.15rem 0.6rem',
        borderRadius: '12px',
        fontSize: '0.7rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        backgroundColor: 'var(--color-surface, rgba(255,255,255,0.06))',
        color: 'var(--color-accent, #D4A843)',
        border: '1px solid var(--color-accent, #D4A843)',
      }}
    >
      {tag}
    </span>
  );
}

function PostShowReport({ report, onClose }: { report: SponsorReport; onClose: () => void }) {
  const booking = report.booking;
  const showDate = new Date(booking.show_date).toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '2rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#fff',
          color: '#1a1a2e',
          borderRadius: '12px',
          maxWidth: 640,
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          padding: 0,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header band */}
        <div
          style={{
            backgroundColor: '#1a1a2e',
            color: '#D4A843',
            padding: '2rem',
            borderRadius: '12px 12px 0 0',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '0.5rem' }}>
            Post-Show Sponsor Report
          </div>
          <div style={{ fontSize: '1.5rem', fontFamily: 'Georgia, serif', fontWeight: 700 }}>
            {booking.location}
          </div>
          <div style={{ fontSize: '0.85rem', opacity: 0.8, marginTop: '0.25rem' }}>{showDate}</div>
        </div>

        {/* Sponsor branding area */}
        {report.sponsors.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', padding: '1.5rem', borderBottom: '1px solid #e5e7eb', flexWrap: 'wrap' }}>
            {report.sponsors.map((s) => (
              <div key={s.id} style={{ textAlign: 'center' }}>
                <SponsorInitials name={s.name} />
                <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', fontWeight: 600 }}>{s.name}</div>
              </div>
            ))}
          </div>
        )}

        {/* Details */}
        <div style={{ padding: '1.5rem 2rem' }}>
          <table style={{ width: '100%', fontSize: '0.9rem', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ padding: '0.4rem 0', fontWeight: 600, color: '#6b7280' }}>Operator</td>
                <td style={{ padding: '0.4rem 0' }}>{booking.operator_name}</td>
              </tr>
              <tr>
                <td style={{ padding: '0.4rem 0', fontWeight: 600, color: '#6b7280' }}>Drone Count</td>
                <td style={{ padding: '0.4rem 0' }}>{booking.drone_count}</td>
              </tr>
              <tr>
                <td style={{ padding: '0.4rem 0', fontWeight: 600, color: '#6b7280' }}>Status</td>
                <td style={{ padding: '0.4rem 0', textTransform: 'capitalize' }}>{booking.status}</td>
              </tr>
              <tr>
                <td style={{ padding: '0.4rem 0', fontWeight: 600, color: '#6b7280' }}>Location</td>
                <td style={{ padding: '0.4rem 0' }}>{booking.location}</td>
              </tr>
            </tbody>
          </table>

          {report.sponsors.length > 0 && (
            <>
              <h4 style={{ margin: '1.5rem 0 0.75rem', fontFamily: 'Georgia, serif', fontSize: '1rem' }}>Sponsors</h4>
              {report.sponsors.map((s) => (
                <div
                  key={s.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem',
                    marginBottom: '0.5rem',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                  }}
                >
                  <SponsorInitials name={s.name} />
                  <div>
                    <div style={{ fontWeight: 700, fontFamily: 'Georgia, serif' }}>{s.name}</div>
                    {s.campaign_name && <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Campaign: {s.campaign_name}</div>}
                    {s.campaign_tag && <CampaignBadge tag={s.campaign_tag} />}
                  </div>
                </div>
              ))}
            </>
          )}
          {report.sponsors.length === 0 && (
            <p style={{ color: '#6b7280', fontStyle: 'italic', marginTop: '1rem' }}>No sponsors attached to this booking.</p>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '1rem 2rem', borderTop: '1px solid #e5e7eb', textAlign: 'right' }}>
          <button
            type="button"
            onClick={() => window.print()}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              backgroundColor: '#fff',
              cursor: 'pointer',
              marginRight: '0.5rem',
              fontSize: '0.85rem',
            }}
          >
            Print
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: '#1a1a2e',
              color: '#D4A843',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 600,
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export function SponsorsPage() {
  const { sponsors, loading, error, createSponsor, attachSponsor, getReport } = useSponsors();
  const { bookings, loading: bookingsLoading } = useBookings();

  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [campaignTag, setCampaignTag] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const [attachBookingId, setAttachBookingId] = useState('');
  const [attachSponsorId, setAttachSponsorId] = useState('');
  const [attachCampaignName, setAttachCampaignName] = useState('');
  const [attachError, setAttachError] = useState<string | null>(null);
  const [attachSuccess, setAttachSuccess] = useState<string | null>(null);

  const [report, setReport] = useState<SponsorReport | null>(null);
  const [reportBookingId, setReportBookingId] = useState('');

  const handleCreate = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setFormError(null);
      try {
        await createSponsor({ name, campaign_tag: campaignTag || null, contact_email: contactEmail || null });
        setName('');
        setCampaignTag('');
        setContactEmail('');
        setShowAddForm(false);
      } catch (err) {
        setFormError(err instanceof Error ? err.message : 'Failed to create sponsor');
      }
    },
    [name, campaignTag, contactEmail, createSponsor],
  );

  const handleAttach = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setAttachError(null);
      setAttachSuccess(null);
      try {
        await attachSponsor({ booking_id: attachBookingId, sponsor_id: attachSponsorId, campaign_name: attachCampaignName || null });
        setAttachSuccess('Sponsor attached successfully');
        setAttachCampaignName('');
      } catch (err) {
        setAttachError(err instanceof Error ? err.message : 'Failed to attach sponsor');
      }
    },
    [attachBookingId, attachSponsorId, attachCampaignName, attachSponsor],
  );

  const handleReport = useCallback(async () => {
    if (!reportBookingId) return;
    try {
      const data = await getReport(reportBookingId);
      setReport(data);
    } catch { /* ignore */ }
  }, [reportBookingId, getReport]);

  if (loading) return <div className="page"><h2>Sponsors & Brand Partners</h2><p>Loading sponsors...</p></div>;
  if (error) return <div className="page"><h2>Sponsors & Brand Partners</h2><p style={{ color: 'var(--color-danger, #e74c3c)' }}>Error: {error.message}</p></div>;

  const inputStyle = { width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border, #333)', backgroundColor: 'var(--color-surface, #222)', color: 'inherit' };
  const btnAccent = { padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', backgroundColor: 'var(--color-accent, #D4A843)', color: '#1a1a2e', cursor: 'pointer', fontWeight: 600 as const };

  return (
    <div className="page">
      <h2>Sponsors & Brand Partners</h2>

      {/* Sponsor list */}
      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        {sponsors.map((s) => (
          <div key={s.id} className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <SponsorInitials name={s.name} />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: '1.1rem', fontWeight: 700 }}>{s.name}</div>
              {s.campaign_tag && <CampaignBadge tag={s.campaign_tag} />}
              {s.contact_email && <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary, #999)', marginTop: '0.25rem' }}>{s.contact_email}</div>}
            </div>
          </div>
        ))}
        {sponsors.length === 0 && <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--color-text-secondary, #999)' }}>No sponsors yet. Add your first sponsor below.</p>}
      </div>

      {/* Add Sponsor */}
      <div style={{ marginBottom: '2rem' }}>
        {!showAddForm ? (
          <button type="button" onClick={() => setShowAddForm(true)} style={btnAccent}>+ Add Sponsor</button>
        ) : (
          <div className="stat-card" style={{ maxWidth: 480 }}>
            <h3 style={{ margin: '0 0 1rem', fontFamily: 'Georgia, serif' }}>New Sponsor</h3>
            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem', fontWeight: 600 }}>Company Name *</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required style={inputStyle} />
              </div>
              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem', fontWeight: 600 }}>Campaign Tag</label>
                <input type="text" value={campaignTag} onChange={(e) => setCampaignTag(e.target.value)} placeholder="e.g. summer-gala" style={inputStyle} />
              </div>
              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem', fontWeight: 600 }}>Contact Email</label>
                <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} style={inputStyle} />
              </div>
              {formError && <p style={{ color: 'var(--color-danger, #e74c3c)', fontSize: '0.85rem' }}>{formError}</p>}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="submit" style={btnAccent}>Create</button>
                <button type="button" onClick={() => setShowAddForm(false)} style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid var(--color-border, #333)', backgroundColor: 'transparent', color: 'inherit', cursor: 'pointer' }}>Cancel</button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Attach Sponsor to Booking */}
      {sponsors.length > 0 && !bookingsLoading && bookings.length > 0 && (
        <div className="stat-card" style={{ maxWidth: 560, marginBottom: '2rem' }}>
          <h3 style={{ margin: '0 0 1rem', fontFamily: 'Georgia, serif' }}>Attach Sponsor to Booking</h3>
          <form onSubmit={handleAttach}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem', fontWeight: 600 }}>Sponsor</label>
                <select value={attachSponsorId} onChange={(e) => setAttachSponsorId(e.target.value)} required style={inputStyle}>
                  <option value="">Select sponsor...</option>
                  {sponsors.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem', fontWeight: 600 }}>Booking</label>
                <select value={attachBookingId} onChange={(e) => setAttachBookingId(e.target.value)} required style={inputStyle}>
                  <option value="">Select booking...</option>
                  {bookings.map((b) => <option key={b.id} value={b.id}>{b.location} -- {new Date(b.show_date).toLocaleDateString()} ({b.status})</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: '0.75rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem', fontWeight: 600 }}>Campaign Name</label>
              <input type="text" value={attachCampaignName} onChange={(e) => setAttachCampaignName(e.target.value)} placeholder="e.g. 4th of July Spectacular" style={inputStyle} />
            </div>
            {attachError && <p style={{ color: 'var(--color-danger, #e74c3c)', fontSize: '0.85rem' }}>{attachError}</p>}
            {attachSuccess && <p style={{ color: 'var(--color-success, #27ae60)', fontSize: '0.85rem' }}>{attachSuccess}</p>}
            <button type="submit" style={btnAccent}>Attach</button>
          </form>
        </div>
      )}

      {/* Post-Show Report */}
      {!bookingsLoading && bookings.length > 0 && (
        <div className="stat-card" style={{ maxWidth: 560 }}>
          <h3 style={{ margin: '0 0 1rem', fontFamily: 'Georgia, serif' }}>Post-Show Sponsor Report</h3>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem', fontWeight: 600 }}>Booking</label>
              <select value={reportBookingId} onChange={(e) => setReportBookingId(e.target.value)} style={inputStyle}>
                <option value="">Select booking...</option>
                {bookings.map((b) => <option key={b.id} value={b.id}>{b.location} -- {new Date(b.show_date).toLocaleDateString()} ({b.status})</option>)}
              </select>
            </div>
            <button type="button" onClick={handleReport} disabled={!reportBookingId} style={{ ...btnAccent, opacity: reportBookingId ? 1 : 0.5, cursor: reportBookingId ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap' as const }}>View Report</button>
          </div>
        </div>
      )}

      {report && <PostShowReport report={report} onClose={() => setReport(null)} />}
    </div>
  );
}
