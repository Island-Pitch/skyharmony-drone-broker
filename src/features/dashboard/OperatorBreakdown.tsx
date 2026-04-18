import { useOperatorBreakdown } from '@/hooks/useOperatorBreakdown';

/** Per-operator allocation breakdown with horizontal bar visualization. */
export function OperatorBreakdown() {
  const { operators, loading } = useOperatorBreakdown();

  if (loading) {
    return <p>Loading operator data...</p>;
  }

  const maxDrones = Math.max(...operators.map((o) => o.allocated_drones), 1);

  return (
    <div className="dashboard-widget" data-testid="operator-breakdown">
      <h3>Operator Allocation Breakdown</h3>
      {operators.length === 0 ? (
        <p className="empty-state">No operator data</p>
      ) : (
        <div className="operator-list">
          {operators.map((op) => (
            <div key={op.operator_name} className="operator-row">
              <div className="operator-info">
                <span className="operator-name">{op.operator_name}</span>
                <span className="operator-stats">
                  {op.allocated_drones} drones | {op.utilization_pct}% util | {op.contribution_pct}% contribution
                </span>
              </div>
              <div className="operator-bar-container">
                <div
                  className="operator-bar"
                  style={{ width: `${(op.allocated_drones / maxDrones) * 100}%` }}
                  role="meter"
                  aria-label={`${op.operator_name} allocation`}
                  aria-valuenow={op.allocated_drones}
                  aria-valuemin={0}
                  aria-valuemax={maxDrones}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
