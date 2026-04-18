import { useState } from 'react';
import { useLogistics } from '@/hooks/useLogistics';
import { ManifestDetail } from './ManifestDetail';
import type { Manifest } from '@/data/models/manifest';

const STATUS_COLORS: Record<string, string> = {
  draft: '#6b7280',
  in_transit: '#2563eb',
  delivered: '#16a34a',
  complete: '#059669',
};

function ManifestRow({ manifest, onSelect }: { manifest: Manifest; onSelect: (id: string) => void }) {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '--';
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const assetCount = Array.isArray(manifest.assets) ? manifest.assets.length : 0;

  return (
    <tr
      onClick={() => onSelect(manifest.id)}
      style={{ cursor: 'pointer' }}
    >
      <td style={{ padding: '0.6rem 0.75rem', fontFamily: 'monospace', fontSize: '0.8rem' }}>
        {manifest.id.slice(0, 8)}
      </td>
      <td style={{ padding: '0.6rem 0.75rem' }}>
        <span
          style={{
            padding: '0.15rem 0.5rem',
            borderRadius: '10px',
            fontSize: '0.7rem',
            fontWeight: 600,
            color: '#fff',
            background: STATUS_COLORS[manifest.status] ?? '#6b7280',
          }}
        >
          {manifest.status.replace('_', ' ').toUpperCase()}
        </span>
      </td>
      <td style={{ padding: '0.6rem 0.75rem', fontSize: '0.85rem' }}>
        {manifest.pickup_location ?? '--'}
      </td>
      <td style={{ padding: '0.6rem 0.75rem', fontSize: '0.85rem' }}>
        {manifest.delivery_location ?? '--'}
      </td>
      <td style={{ padding: '0.6rem 0.75rem', fontSize: '0.85rem', textAlign: 'center' }}>
        {assetCount}
      </td>
      <td style={{ padding: '0.6rem 0.75rem', fontSize: '0.85rem' }}>
        {formatDate(manifest.pickup_date)}
      </td>
      <td style={{ padding: '0.6rem 0.75rem', fontSize: '0.85rem' }}>
        {formatDate(manifest.delivery_date)}
      </td>
    </tr>
  );
}

/** Main logistics page with manifest list and detail view. */
export function LogisticsPage() {
  const { manifests, loading } = useLogistics();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (selectedId) {
    return (
      <div className="page">
        <ManifestDetail manifestId={selectedId} onBack={() => setSelectedId(null)} />
      </div>
    );
  }

  return (
    <div className="page">
      <h2>Logistics</h2>
      <p style={{ opacity: 0.6, marginBottom: '1.5rem', fontSize: '0.9rem' }}>
        Manage transport manifests and track asset deliveries.
      </p>

      {loading ? (
        <p style={{ opacity: 0.6 }}>Loading manifests...</p>
      ) : manifests.length === 0 ? (
        <div
          style={{
            padding: '2rem',
            textAlign: 'center',
            border: '1px solid var(--color-border, #333)',
            borderRadius: '8px',
            opacity: 0.6,
          }}
        >
          No manifests found. Create one from a booking allocation.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr
                style={{
                  borderBottom: '1px solid var(--color-border, #333)',
                  textAlign: 'left',
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  opacity: 0.6,
                }}
              >
                <th style={{ padding: '0.5rem 0.75rem' }}>ID</th>
                <th style={{ padding: '0.5rem 0.75rem' }}>Status</th>
                <th style={{ padding: '0.5rem 0.75rem' }}>Pickup</th>
                <th style={{ padding: '0.5rem 0.75rem' }}>Delivery</th>
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>Assets</th>
                <th style={{ padding: '0.5rem 0.75rem' }}>Pickup Date</th>
                <th style={{ padding: '0.5rem 0.75rem' }}>Delivery Date</th>
              </tr>
            </thead>
            <tbody>
              {manifests.map((m) => (
                <ManifestRow key={m.id} manifest={m} onSelect={setSelectedId} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
