/** Semi-transparent prototype watermark overlay (SHD-51). */
export function DemoWatermark() {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1rem',
        right: '1rem',
        opacity: 0.2,
        fontSize: '0.75rem',
        color: '#ffffff',
        pointerEvents: 'none',
        userSelect: 'none',
        zIndex: 9999,
        fontFamily: 'monospace',
        letterSpacing: '0.05em',
      }}
    >
      Prototype — Sample Data Only
    </div>
  );
}
