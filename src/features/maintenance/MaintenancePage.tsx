import { useState } from 'react';
import { useMaintenance } from '@/hooks/useMaintenance';
import { RulesList } from './RulesList';
import { TicketQueue } from './TicketQueue';

type Tab = 'rules' | 'tickets' | 'evaluate';

/** Maintenance page with tabs: Rules, Tickets, Evaluate. */
export function MaintenancePage() {
  const {
    rules,
    tickets,
    loadingRules,
    loadingTickets,
    updateRule,
    evaluate,
    updateTicket,
    completeTicket,
  } = useMaintenance();

  const [activeTab, setActiveTab] = useState<Tab>('tickets');
  const [evaluating, setEvaluating] = useState(false);
  const [evaluateResult, setEvaluateResult] = useState<string | null>(null);

  async function handleEvaluate() {
    setEvaluating(true);
    setEvaluateResult(null);
    try {
      const result = await evaluate();
      setEvaluateResult(`Evaluation complete. ${result.tickets_created} new ticket(s) created.`);
    } catch (err) {
      setEvaluateResult(`Evaluation failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setEvaluating(false);
    }
  }

  async function handleToggleRule(id: string, enabled: boolean) {
    await updateRule(id, { enabled });
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'tickets', label: 'Tickets' },
    { key: 'rules', label: 'Rules' },
    { key: 'evaluate', label: 'Evaluate' },
  ];

  return (
    <div className="page">
      <h2>Maintenance</h2>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`btn-primary${activeTab === tab.key ? '' : ' btn-secondary'}`}
            onClick={() => setActiveTab(tab.key)}
            style={
              activeTab !== tab.key
                ? { background: 'var(--color-surface)', color: 'var(--color-text)' }
                : undefined
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'rules' && (
        <RulesList rules={rules} loading={loadingRules} onToggle={handleToggleRule} />
      )}

      {activeTab === 'tickets' && (
        <TicketQueue
          tickets={tickets}
          loading={loadingTickets}
          onUpdate={updateTicket}
          onComplete={completeTicket}
        />
      )}

      {activeTab === 'evaluate' && (
        <div>
          <p>
            Run all enabled maintenance rules against all fleet assets. This will create tickets
            for any assets that violate rule thresholds.
          </p>
          <p>
            Assets flagged with <strong>mandatory_ground</strong> severity will automatically
            have their status set to <em>maintenance</em>.
          </p>
          <button
            className="btn-primary"
            onClick={handleEvaluate}
            disabled={evaluating}
            style={{ marginTop: '1rem' }}
          >
            {evaluating ? 'Evaluating...' : 'Run Evaluation'}
          </button>
          {evaluateResult && (
            <p style={{ marginTop: '1rem', fontWeight: 'bold' }}>{evaluateResult}</p>
          )}
        </div>
      )}
    </div>
  );
}
