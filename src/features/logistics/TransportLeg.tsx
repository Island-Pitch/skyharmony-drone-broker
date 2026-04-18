import { useState } from 'react';
import type { TransportLeg as TransportLegType, LegStatusValue } from '@/data/models/manifest';

const STATUS_COLORS: Record<string, string> = {
  pending: '#6b7280',
  loading: '#d97706',
  in_transit: '#2563eb',
  unloading: '#7c3aed',
  complete: '#16a34a',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  loading: 'Loading',
  in_transit: 'In Transit',
  unloading: 'Unloading',
  complete: 'Complete',
};

const NEXT_STATUS: Record<string, LegStatusValue | null> = {
  pending: 'loading',
  loading: 'in_transit',
  in_transit: 'unloading',
  unloading: 'complete',
  complete: null,
};

interface TransportLegProps {
  leg: TransportLegType;
  onUpdateStatus?: (legId: string, status: LegStatusValue) => Promise<void>;
}

/** Card component for a single transport leg with status timeline. */
export function TransportLeg({ leg, onUpdateStatus }: TransportLegProps) {
  const [updating, setUpdating] = useState(false);
  const nextStatus = NEXT_STATUS[leg.status];

  const handleAdvance = async () => {
    if (!nextStatus || !onUpdateStatus) return;
    setUpdating(true);
    try {
      await onUpdateStatus(leg.id, nextStatus);
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '--';
    return new Date(dateStr).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      style={{
        border: '1px solid var(--color-border, #333)',
        borderRadius: '8px',
        padding: '1rem',
        background: 'var(--color-surface, #1a1a2e)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <span style={{ fontWeight: 600 }}>Leg {leg.leg_number}</span>
        <span
          style={{
            padding: '0.2rem 0.6rem',
            borderRadius: '12px',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: '#fff',
            background: STATUS_COLORS[leg.status] ?? '#6b7280',
          }}
        >
          {STATUS_LABELS[leg.status] ?? leg.status}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '0.5rem', alignItems: 'center', marginBottom: '0.75rem' }}>
        <div>
          <div style={{ fontSize: '0.7rem', opacity: 0.6, textTransform: 'uppercase' }}>Origin</div>
          <div style={{ fontSize: '0.85rem' }}>{leg.origin ?? '--'}</div>
        </div>
        <div style={{ fontSize: '1.2rem', opacity: 0.4 }}>&#8594;</div>
        <div>
          <div style={{ fontSize: '0.7rem', opacity: 0.6, textTransform: 'uppercase' }}>Destination</div>
          <div style={{ fontSize: '0.85rem' }}>{leg.destination ?? '--'}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem', fontSize: '0.8rem' }}>
        {leg.driver_name && (
          <div>
            <span style={{ opacity: 0.6 }}>Driver: </span>
            {leg.driver_name}
          </div>
        )}
        {leg.vehicle_info && (
          <div>
            <span style={{ opacity: 0.6 }}>Vehicle: </span>
            {leg.vehicle_info}
          </div>
        )}
        <div>
          <span style={{ opacity: 0.6 }}>Departed: </span>
          {formatDate(leg.departed_at)}
        </div>
        <div>
          <span style={{ opacity: 0.6 }}>Arrived: </span>
          {formatDate(leg.arrived_at)}
        </div>
      </div>

      {/* Status timeline */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.75rem' }}>
        {['pending', 'loading', 'in_transit', 'unloading', 'complete'].map((s) => {
          const steps = ['pending', 'loading', 'in_transit', 'unloading', 'complete'];
          const currentIdx = steps.indexOf(leg.status);
          const stepIdx = steps.indexOf(s);
          const isActive = stepIdx <= currentIdx;
          return (
            <div
              key={s}
              style={{
                flex: 1,
                height: '4px',
                borderRadius: '2px',
                background: isActive ? (STATUS_COLORS[leg.status] ?? '#6b7280') : 'var(--color-border, #333)',
              }}
            />
          );
        })}
      </div>

      {nextStatus && onUpdateStatus && (
        <button
          className="btn-primary"
          onClick={handleAdvance}
          disabled={updating}
          style={{ width: '100%', fontSize: '0.8rem', padding: '0.4rem' }}
        >
          {updating ? 'Updating...' : `Advance to ${STATUS_LABELS[nextStatus]}`}
        </button>
      )}
    </div>
  );
}
