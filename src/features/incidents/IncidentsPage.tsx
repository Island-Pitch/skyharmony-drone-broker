import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { IncidentReportForm } from './IncidentReportForm';
import { IncidentQueue } from './IncidentQueue';

type Tab = 'report' | 'queue';

/** Incidents page with tab navigation between report form and admin queue. */
export function IncidentsPage() {
  const [searchParams] = useSearchParams();
  const prefilledAssetId = searchParams.get('assetId') ?? undefined;

  const [activeTab, setActiveTab] = useState<Tab>('report');

  return (
    <div className="page">
      <h2>Incidents</h2>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <button
          className={`btn-primary${activeTab === 'report' ? '' : ' btn-secondary'}`}
          onClick={() => setActiveTab('report')}
          style={
            activeTab !== 'report'
              ? {
                  background: 'var(--color-surface)',
                  color: 'var(--color-text)',
                }
              : undefined
          }
        >
          Report Incident
        </button>
        <button
          className={`btn-primary${activeTab === 'queue' ? '' : ' btn-secondary'}`}
          onClick={() => setActiveTab('queue')}
          style={
            activeTab !== 'queue'
              ? {
                  background: 'var(--color-surface)',
                  color: 'var(--color-text)',
                }
              : undefined
          }
        >
          Incident Queue
        </button>
      </div>

      {activeTab === 'report' && (
        <IncidentReportForm prefilledAssetId={prefilledAssetId} />
      )}
      {activeTab === 'queue' && <IncidentQueue />}
    </div>
  );
}
