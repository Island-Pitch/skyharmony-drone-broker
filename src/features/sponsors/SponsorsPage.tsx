import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/auth/useAuth';
import { Role } from '@/auth/roles';
import { apiGet } from '@/data/repositories/http/apiClient';

/* ---------- Types ---------- */

interface Sponsor {
  id: string;
  name: string;
  logo_url: string | null;
  campaign_tag: string | null;
  contact_email: string | null;
  created_at: string;
}

interface SponsorShow {
  booking_id: string;
  operator_name: string;
  show_date: string;
  end_date: string | null;
  drone_count: number;
  location: string;
  status: string;
  campaign_name: string | null;
  report_url: string;
}

interface PortalData {
  sponsor: {
    id: string;
    name: string;
    logo_url: string | null;
    campaign_tag: string | null;
  } | null;
  shows: SponsorShow[];
}

/* ---------- Admin view ---------- */

function AdminSponsorView() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSponsors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiGet<Sponsor[]>('/sponsors');
      setSponsors(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sponsors');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSponsors();
  }, [fetchSponsors]);

  if (loading) return <p>Loading sponsors...</p>;
  if (error) return <p style={{ color: 'var(--color-danger, #ef4444)' }}>{error}</p>;

  return (
    <>
      <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>
        Manage Sponsors ({sponsors.length})
      </h3>
      {sponsors.length === 0 ? (
        <p style={{ color: 'var(--color-text-muted)' }}>No sponsors registered yet.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Campaign Tag</th>
                <th style={thStyle}>Contact</th>
                <th style={thStyle}>Created</th>
              </tr>
            </thead>
            <tbody>
              {sponsors.map((s) => (
                <tr key={s.id}>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {s.logo_url && (
                        <img
                          src={s.logo_url}
                          alt=""
                          style={{ width: 24, height: 24, borderRadius: 4, objectFit: 'cover' }}
                        />
                      )}
                      {s.name}
                    </div>
                  </td>
                  <td style={tdStyle}>{s.campaign_tag ?? '-'}</td>
                  <td style={tdStyle}>{s.contact_email ?? '-'}</td>
                  <td style={tdStyle}>
                    {new Date(s.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

/* ---------- Sponsor portal view ---------- */

function SponsorPortalView() {
  const [portal, setPortal] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPortal = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiGet<PortalData>('/sponsors/portal');
      setPortal(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load portal data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPortal();
  }, [fetchPortal]);

  if (loading) return <p>Loading your sponsor portal...</p>;
  if (error) return <p style={{ color: 'var(--color-danger, #ef4444)' }}>{error}</p>;

  if (!portal?.sponsor) {
    return (
      <p style={{ color: 'var(--color-text-muted)' }}>
        No sponsor account linked to your profile. Contact an administrator.
      </p>
    );
  }

  return (
    <>
      <div
        style={{
          padding: '1rem',
          borderRadius: '8px',
          border: '1px solid var(--color-border, #333)',
          background: 'var(--color-surface, #1e1e2e)',
          marginBottom: '1.5rem',
        }}
      >
        <h3 style={{ margin: '0 0 0.5rem 0' }}>{portal.sponsor.name}</h3>
        {portal.sponsor.campaign_tag && (
          <span
            style={{
              padding: '2px 10px',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 600,
              background: 'var(--color-primary, #6366f1)',
              color: '#fff',
            }}
          >
            {portal.sponsor.campaign_tag}
          </span>
        )}
      </div>

      <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>
        Your Sponsored Shows ({portal.shows.length})
      </h3>

      {portal.shows.length === 0 ? (
        <p style={{ color: 'var(--color-text-muted)' }}>No shows yet.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Show Date</th>
                <th style={thStyle}>Location</th>
                <th style={thStyle}>Operator</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Drones</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Campaign</th>
                <th style={thStyle}>Report</th>
              </tr>
            </thead>
            <tbody>
              {portal.shows.map((s) => (
                <tr key={s.booking_id}>
                  <td style={tdStyle}>
                    {new Date(s.show_date).toLocaleDateString()}
                  </td>
                  <td style={tdStyle}>{s.location}</td>
                  <td style={tdStyle}>{s.operator_name}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    {s.drone_count}
                  </td>
                  <td style={tdStyle}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background:
                          s.status === 'completed'
                            ? 'var(--color-success, #22c55e)'
                            : s.status === 'cancelled'
                              ? 'var(--color-danger, #ef4444)'
                              : 'var(--color-warning, #f59e0b)',
                        color: '#fff',
                      }}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td style={tdStyle}>{s.campaign_name ?? '-'}</td>
                  <td style={tdStyle}>
                    <a
                      href={s.report_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'var(--color-primary, #6366f1)' }}
                    >
                      View Report
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

/* ---------- Main page ---------- */

export function SponsorsPage() {
  const { role } = useAuth();
  const isSponsor = role === Role.Sponsor;

  return (
    <div className="page">
      <h2 style={{ marginBottom: '1.5rem' }}>
        {isSponsor ? 'Sponsor Portal' : 'Sponsors'}
      </h2>
      {isSponsor ? <SponsorPortalView /> : <AdminSponsorView />}
    </div>
  );
}

/* ---------- Styles ---------- */

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '0.6rem 0.75rem',
  borderBottom: '2px solid var(--color-border, #333)',
  fontSize: '0.8rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: 'var(--color-text-muted)',
};

const tdStyle: React.CSSProperties = {
  padding: '0.6rem 0.75rem',
  borderBottom: '1px solid var(--color-border, #333)',
};
