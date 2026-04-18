/**
 * SHD-51: Semi-transparent demo watermark overlay.
 * Controlled by VITE_DEMO_MODE env var. Set to "true" to show.
 * In production with real data, omit the env var to hide.
 */
export function DemoWatermark() {
  const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';
  if (!isDemoMode) return null;

  return (
    <div
      className="demo-watermark"
      style={{
        position: 'fixed',
        bottom: '1rem',
        right: '1rem',
        opacity: 0.25,
        fontSize: '0.7rem',
        color: '#D4A843',
        pointerEvents: 'none',
        userSelect: 'none',
        zIndex: 9999,
        fontFamily: 'monospace',
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
      }}
      aria-hidden="true"
    >
      Demo Environment — Sample Data
    </div>
  );
}
