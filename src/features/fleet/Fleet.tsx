export function Fleet() {
  const drones = [
    { id: 'DRN-001', model: 'SkyHawk X4', status: 'active', battery: 87 },
    { id: 'DRN-002', model: 'AeroLite Pro', status: 'idle', battery: 100 },
    { id: 'DRN-003', model: 'SkyHawk X4', status: 'maintenance', battery: 45 },
    { id: 'DRN-004', model: 'CargoMax 8', status: 'active', battery: 62 },
  ];

  return (
    <div className="page fleet">
      <h2>Fleet Management</h2>
      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Model</th>
            <th>Status</th>
            <th>Battery</th>
          </tr>
        </thead>
        <tbody>
          {drones.map((d) => (
            <tr key={d.id}>
              <td>{d.id}</td>
              <td>{d.model}</td>
              <td><span className={`status-badge ${d.status}`}>{d.status}</span></td>
              <td>{d.battery}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
