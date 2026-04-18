import { useState } from 'react';
import { useRouteOptimizer, ROUTE_LOCATIONS } from '@/hooks/useRouteOptimizer';

/** Route optimization panel: select pickup + delivery locations, optimize, view results. */
export function RouteOptimizer() {
  const { result, loading, error, optimize, reset } = useRouteOptimizer();
  const [pickup, setPickup] = useState('');
  const [deliveries, setDeliveries] = useState<string[]>([]);

  const availableDeliveries = ROUTE_LOCATIONS.filter((l) => l !== pickup);

  const toggleDelivery = (loc: string) => {
    setDeliveries((prev) =>
      prev.includes(loc) ? prev.filter((d) => d !== loc) : [...prev, loc],
    );
  };

  const handleOptimize = () => {
    if (!pickup || deliveries.length === 0) return;
    optimize(pickup, deliveries);
  };

  const handleReset = () => {
    setPickup('');
    setDeliveries([]);
    reset();
  };

  return (
    <div>
      <h3 style={{ marginBottom: '1rem' }}>Route Optimizer</h3>
      <p style={{ opacity: 0.6, marginBottom: '1.5rem', fontSize: '0.85rem' }}>
        Select a pickup location and delivery destinations, then optimize for shortest route.
      </p>

      {/* Pickup selector */}
      <div style={{ marginBottom: '1rem' }}>
        <label
          htmlFor="route-pickup"
          style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', opacity: 0.6, marginBottom: '0.3rem' }}
        >
          Pickup Location
        </label>
        <select
          id="route-pickup"
          value={pickup}
          onChange={(e) => {
            setPickup(e.target.value);
            setDeliveries((prev) => prev.filter((d) => d !== e.target.value));
          }}
          style={{
            width: '100%',
            padding: '0.5rem',
            borderRadius: '6px',
            border: '1px solid var(--color-border, #333)',
            background: 'var(--color-surface, #1a1a2e)',
            color: 'inherit',
            fontSize: '0.9rem',
          }}
        >
          <option value="">Select pickup...</option>
          {ROUTE_LOCATIONS.map((loc) => (
            <option key={loc} value={loc}>{loc}</option>
          ))}
        </select>
      </div>

      {/* Delivery checkboxes */}
      {pickup && (
        <div style={{ marginBottom: '1.25rem' }}>
          <label
            style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', opacity: 0.6, marginBottom: '0.5rem' }}
          >
            Delivery Destinations
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {availableDeliveries.map((loc) => {
              const selected = deliveries.includes(loc);
              return (
                <button
                  key={loc}
                  type="button"
                  onClick={() => toggleDelivery(loc)}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '16px',
                    border: selected ? '1px solid #2563eb' : '1px solid var(--color-border, #333)',
                    background: selected ? '#2563eb22' : 'transparent',
                    color: selected ? '#60a5fa' : 'inherit',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  {loc}
                </button>
              );
            })}
          </div>
          {deliveries.length > 0 && (
            <p style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: '0.4rem' }}>
              {deliveries.length} destination{deliveries.length !== 1 ? 's' : ''} selected
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <button
          type="button"
          onClick={handleOptimize}
          disabled={!pickup || deliveries.length === 0 || loading}
          style={{
            padding: '0.5rem 1.25rem',
            borderRadius: '6px',
            border: 'none',
            background: '#2563eb',
            color: '#fff',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: !pickup || deliveries.length === 0 || loading ? 'not-allowed' : 'pointer',
            opacity: !pickup || deliveries.length === 0 || loading ? 0.5 : 1,
          }}
        >
          {loading ? 'Optimizing...' : 'Optimize Route'}
        </button>
        {(result || error) && (
          <button
            type="button"
            onClick={handleReset}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              border: '1px solid var(--color-border, #333)',
              background: 'transparent',
              color: 'inherit',
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            Reset
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            background: '#dc262622',
            border: '1px solid #dc2626',
            color: '#f87171',
            fontSize: '0.85rem',
            marginBottom: '1rem',
          }}
        >
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div
          style={{
            border: '1px solid var(--color-border, #333)',
            borderRadius: '8px',
            overflow: 'hidden',
          }}
        >
          {/* Summary */}
          <div
            style={{
              padding: '1rem',
              borderBottom: '1px solid var(--color-border, #333)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Optimized Route</span>
            <span
              style={{
                background: '#16a34a22',
                color: '#4ade80',
                padding: '0.2rem 0.6rem',
                borderRadius: '10px',
                fontSize: '0.8rem',
                fontWeight: 600,
              }}
            >
              {result.total_distance_miles} mi total
            </span>
          </div>

          {/* Route visualization */}
          <div style={{ padding: '1rem' }}>
            {/* Start point */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: '#2563eb',
                  flexShrink: 0,
                }}
              />
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{pickup}</span>
              <span style={{ fontSize: '0.7rem', opacity: 0.5, textTransform: 'uppercase' }}>Pickup</span>
            </div>

            {result.legs.map((leg, idx) => (
              <div key={`${leg.from}-${leg.to}`}>
                {/* Connector line */}
                <div style={{ display: 'flex', alignItems: 'stretch', gap: '0.75rem' }}>
                  <div style={{ width: '10px', display: 'flex', justifyContent: 'center' }}>
                    <div style={{ width: '2px', background: '#333', minHeight: '28px' }} />
                  </div>
                  <span style={{ fontSize: '0.75rem', opacity: 0.5, paddingTop: '0.4rem' }}>
                    {leg.distance} mi
                  </span>
                </div>

                {/* Stop */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: idx === result.legs.length - 1 ? '#16a34a' : '#f59e0b',
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{leg.to}</span>
                  <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>
                    Stop {idx + 1}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Leg table */}
          <div style={{ borderTop: '1px solid var(--color-border, #333)', padding: '0.75rem 1rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ opacity: 0.6, textTransform: 'uppercase', fontSize: '0.7rem' }}>
                  <th style={{ padding: '0.4rem 0.5rem', textAlign: 'left' }}>Leg</th>
                  <th style={{ padding: '0.4rem 0.5rem', textAlign: 'left' }}>From</th>
                  <th style={{ padding: '0.4rem 0.5rem', textAlign: 'left' }}>To</th>
                  <th style={{ padding: '0.4rem 0.5rem', textAlign: 'right' }}>Distance</th>
                </tr>
              </thead>
              <tbody>
                {result.legs.map((leg, idx) => (
                  <tr
                    key={`${leg.from}-${leg.to}`}
                    style={{ borderTop: '1px solid var(--color-border, #222)' }}
                  >
                    <td style={{ padding: '0.4rem 0.5rem' }}>{idx + 1}</td>
                    <td style={{ padding: '0.4rem 0.5rem' }}>{leg.from}</td>
                    <td style={{ padding: '0.4rem 0.5rem' }}>{leg.to}</td>
                    <td style={{ padding: '0.4rem 0.5rem', textAlign: 'right' }}>{leg.distance} mi</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
