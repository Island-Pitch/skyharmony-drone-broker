import { useState, useEffect, useCallback } from 'react';
import { useLogistics } from '@/hooks/useLogistics';
import { TransportLeg } from './TransportLeg';
import type { ManifestDetail as ManifestDetailType, LegStatusValue } from '@/data/models/manifest';

const STATUS_COLORS: Record<string, string> = {
  draft: '#6b7280',
  in_transit: '#2563eb',
  delivered: '#16a34a',
  complete: '#059669',
};

interface ManifestDetailProps {
  manifestId: string;
  onBack: () => void;
}

/** Detail view for a single manifest showing assets and transport legs with timeline. */
export function ManifestDetail({ manifestId, onBack }: ManifestDetailProps) {
  const { getManifest, addLeg, updateLeg } = useLogistics();
  const [detail, setDetail] = useState<ManifestDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddLeg, setShowAddLeg] = useState(false);
  const [legForm, setLegForm] = useState({ origin: '', destination: '', driver_name: '', vehicle_info: '' });

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getManifest(manifestId);
      setDetail(data);
    } finally {
      setLoading(false);
    }
  }, [getManifest, manifestId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleUpdateLegStatus = async (legId: string, status: LegStatusValue) => {
    await updateLeg(legId, { status });
    await refresh();
  };

  const handleAddLeg = async () => {
    if (!legForm.origin || !legForm.destination) return;
    await addLeg(manifestId, {
      origin: legForm.origin,
      destination: legForm.destination,
      driver_name: legForm.driver_name || undefined,
      vehicle_info: legForm.vehicle_info || undefined,
    });
    setLegForm({ origin: '', destination: '', driver_name: '', vehicle_info: '' });
    setShowAddLeg(false);
    await refresh();
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '--';
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="page">
        <p style={{ opacity: 0.6 }}>Loading manifest...</p>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="page">
        <button className="btn-primary" onClick={onBack} style={{ marginBottom: '1rem' }}>
          Back to Manifests
        </button>
        <p>Manifest not found.</p>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={onBack}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--color-accent, #D4A843)',
          cursor: 'pointer',
          padding: '0.25rem 0',
          marginBottom: '1rem',
          fontSize: '0.85rem',
        }}
      >
        &larr; Back to Manifests
      </button>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h3 style={{ margin: 0, marginBottom: '0.25rem' }}>
            Manifest #{detail.id.slice(0, 8)}
          </h3>
          <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>
            Created {formatDate(detail.created_at)}
          </span>
        </div>
        <span
          style={{
            padding: '0.3rem 0.8rem',
            borderRadius: '12px',
            fontSize: '0.8rem',
            fontWeight: 600,
            color: '#fff',
            background: STATUS_COLORS[detail.status] ?? '#6b7280',
          }}
        >
          {detail.status.replace('_', ' ').toUpperCase()}
        </span>
      </div>

      {/* Route info */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1rem',
          marginBottom: '1.5rem',
          padding: '1rem',
          border: '1px solid var(--color-border, #333)',
          borderRadius: '8px',
          background: 'var(--color-surface, #1a1a2e)',
        }}
      >
        <div>
          <div style={{ fontSize: '0.7rem', opacity: 0.6, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Pickup</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{detail.pickup_location ?? '--'}</div>
          <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{formatDate(detail.pickup_date)}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.7rem', opacity: 0.6, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Delivery</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{detail.delivery_location ?? '--'}</div>
          <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{formatDate(detail.delivery_date)}</div>
        </div>
        {detail.notes && (
          <div style={{ gridColumn: '1 / -1' }}>
            <div style={{ fontSize: '0.7rem', opacity: 0.6, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Notes</div>
            <div style={{ fontSize: '0.85rem' }}>{detail.notes}</div>
          </div>
        )}
      </div>

      {/* Assets */}
      <h4 style={{ marginBottom: '0.75rem' }}>Assets ({detail.asset_details.length})</h4>
      {detail.asset_details.length === 0 ? (
        <p style={{ opacity: 0.6, fontSize: '0.85rem' }}>No assets assigned to this manifest.</p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '0.5rem',
            marginBottom: '1.5rem',
          }}
        >
          {detail.asset_details.map((asset) => (
            <div
              key={asset.id}
              style={{
                padding: '0.6rem 0.8rem',
                border: '1px solid var(--color-border, #333)',
                borderRadius: '6px',
                fontSize: '0.8rem',
                background: 'var(--color-surface, #1a1a2e)',
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: '0.2rem' }}>{asset.serial_number}</div>
              <div style={{ opacity: 0.7 }}>
                {asset.manufacturer} {asset.model}
              </div>
              <div style={{ opacity: 0.5, fontSize: '0.75rem' }}>Status: {asset.status}</div>
            </div>
          ))}
        </div>
      )}

      {/* Transport Legs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <h4 style={{ margin: 0 }}>Transport Legs ({detail.legs.length})</h4>
        <button
          className="btn-primary"
          onClick={() => setShowAddLeg(!showAddLeg)}
          style={{ fontSize: '0.8rem', padding: '0.3rem 0.8rem' }}
        >
          {showAddLeg ? 'Cancel' : '+ Add Leg'}
        </button>
      </div>

      {showAddLeg && (
        <div
          style={{
            padding: '1rem',
            border: '1px solid var(--color-border, #333)',
            borderRadius: '8px',
            marginBottom: '1rem',
            background: 'var(--color-surface, #1a1a2e)',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <label>
              <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>Origin</span>
              <input
                type="text"
                value={legForm.origin}
                onChange={(e) => setLegForm({ ...legForm, origin: e.target.value })}
                style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--color-border, #333)', background: 'var(--color-bg, #0f0f23)', color: 'inherit' }}
              />
            </label>
            <label>
              <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>Destination</span>
              <input
                type="text"
                value={legForm.destination}
                onChange={(e) => setLegForm({ ...legForm, destination: e.target.value })}
                style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--color-border, #333)', background: 'var(--color-bg, #0f0f23)', color: 'inherit' }}
              />
            </label>
            <label>
              <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>Driver Name</span>
              <input
                type="text"
                value={legForm.driver_name}
                onChange={(e) => setLegForm({ ...legForm, driver_name: e.target.value })}
                style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--color-border, #333)', background: 'var(--color-bg, #0f0f23)', color: 'inherit' }}
              />
            </label>
            <label>
              <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>Vehicle Info</span>
              <input
                type="text"
                value={legForm.vehicle_info}
                onChange={(e) => setLegForm({ ...legForm, vehicle_info: e.target.value })}
                style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--color-border, #333)', background: 'var(--color-bg, #0f0f23)', color: 'inherit' }}
              />
            </label>
          </div>
          <button
            className="btn-primary"
            onClick={handleAddLeg}
            disabled={!legForm.origin || !legForm.destination}
            style={{ marginTop: '0.75rem', fontSize: '0.8rem' }}
          >
            Add Leg
          </button>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {detail.legs.map((leg) => (
          <TransportLeg key={leg.id} leg={leg} onUpdateStatus={handleUpdateLegStatus} />
        ))}
        {detail.legs.length === 0 && (
          <p style={{ opacity: 0.6, fontSize: '0.85rem' }}>No transport legs yet. Add one above.</p>
        )}
      </div>
    </div>
  );
}
