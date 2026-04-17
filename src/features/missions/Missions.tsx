export function Missions() {
  const missions = [
    { id: 'MSN-101', type: 'Survey', area: 'Zone A', drone: 'DRN-001', progress: 72 },
    { id: 'MSN-102', type: 'Delivery', area: 'Zone C', drone: 'DRN-004', progress: 35 },
    { id: 'MSN-103', type: 'Inspection', area: 'Zone B', drone: null, progress: 0 },
  ];

  return (
    <div className="page missions">
      <h2>Mission Control</h2>
      <div className="mission-list">
        {missions.map((m) => (
          <div key={m.id} className="mission-card">
            <div className="mission-header">
              <strong>{m.id}</strong>
              <span className="mission-type">{m.type}</span>
            </div>
            <div className="mission-details">
              <span>Area: {m.area}</span>
              <span>Drone: {m.drone ?? 'Unassigned'}</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${m.progress}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
