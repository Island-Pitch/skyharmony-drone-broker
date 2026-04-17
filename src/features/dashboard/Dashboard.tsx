export function Dashboard() {
  return (
    <div className="page dashboard">
      <h2>Dashboard</h2>
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-value">12</span>
          <span className="stat-label">Active Drones</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">5</span>
          <span className="stat-label">In-Flight Missions</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">28</span>
          <span className="stat-label">Pending Requests</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">99.2%</span>
          <span className="stat-label">Uptime</span>
        </div>
      </div>
    </div>
  );
}
