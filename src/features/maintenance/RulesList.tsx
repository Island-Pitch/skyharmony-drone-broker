import { useState } from 'react';
import type { MaintenanceRule } from '@/hooks/useMaintenance';

interface RulesListProps {
  rules: MaintenanceRule[];
  loading: boolean;
  onToggle: (id: string, enabled: boolean) => Promise<unknown>;
}

const FIELD_LABELS: Record<string, string> = {
  flight_hours: 'Flight Hours',
  battery_cycles: 'Battery Cycles',
  firmware_version: 'Firmware Version',
};

const OPERATOR_LABELS: Record<string, string> = {
  gte: '>=',
  lte: '<=',
  neq: '!=',
};

const SEVERITY_COLORS: Record<string, string> = {
  warning: 'idle',
  mandatory_ground: 'maintenance',
};

/** Table of maintenance rules with enable/disable toggles. */
export function RulesList({ rules, loading, onToggle }: RulesListProps) {
  const [togglingId, setTogglingId] = useState<string | null>(null);

  async function handleToggle(rule: MaintenanceRule) {
    setTogglingId(rule.id);
    try {
      await onToggle(rule.id, !rule.enabled);
    } finally {
      setTogglingId(null);
    }
  }

  if (loading) return <p>Loading rules...</p>;

  if (rules.length === 0) return <p>No maintenance rules configured.</p>;

  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Rule Name</th>
          <th>Field</th>
          <th>Condition</th>
          <th>Severity</th>
          <th>Enabled</th>
        </tr>
      </thead>
      <tbody>
        {rules.map((rule) => (
          <tr key={rule.id} style={rule.enabled ? undefined : { opacity: 0.5 }}>
            <td>{rule.rule_name}</td>
            <td>{FIELD_LABELS[rule.field] ?? rule.field}</td>
            <td>
              {OPERATOR_LABELS[rule.operator] ?? rule.operator} {rule.threshold_value}
            </td>
            <td>
              <span className={`status-badge ${SEVERITY_COLORS[rule.severity] ?? ''}`}>
                {rule.severity.replace('_', ' ')}
              </span>
            </td>
            <td>
              <button
                className={rule.enabled ? 'btn-primary' : 'btn-outline'}
                onClick={() => handleToggle(rule)}
                disabled={togglingId === rule.id}
                style={{ minWidth: '5rem' }}
              >
                {togglingId === rule.id ? '...' : rule.enabled ? 'Enabled' : 'Disabled'}
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
