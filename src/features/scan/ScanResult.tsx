import type { Asset } from '@/data/models/asset';
import './scan.css';

interface ScanResultProps {
  asset: Asset | null;
  notFound: boolean;
  error: string | null;
  lastAction: 'check_out' | 'check_in' | null;
  actionSuccess: boolean;
  onCheckOut: () => void;
  onCheckIn: () => void;
  onClear: () => void;
}

/** Displays scanned asset details and action buttons. */
export function ScanResult({
  asset,
  notFound,
  error,
  lastAction,
  actionSuccess,
  onCheckOut,
  onCheckIn,
  onClear,
}: ScanResultProps) {
  if (notFound) {
    return (
      <div className="scan-result scan-result-error">
        <h3>Unknown Asset</h3>
        <p>Not in catalog. Verify the serial number and try again.</p>
        <button className="btn-primary" onClick={onClear}>
          Clear
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="scan-result scan-result-error">
        <h3>Error</h3>
        <p>{error}</p>
        <button className="btn-primary" onClick={onClear}>
          Clear
        </button>
      </div>
    );
  }

  if (!asset) return null;

  const statusClass =
    asset.status === 'available'
      ? 'active'
      : asset.status === 'maintenance'
        ? 'maintenance'
        : 'idle';

  return (
    <div className="scan-result">
      {actionSuccess && lastAction && (
        <div className="scan-confirmation" role="alert">
          {lastAction === 'check_out'
            ? `Checked out: ${asset.serial_number}`
            : `Checked in: ${asset.serial_number}`}
        </div>
      )}

      <div className="scan-asset-details">
        <div className="scan-asset-header">
          <h3>{asset.serial_number}</h3>
          <span className={`status-badge ${statusClass}`}>{asset.status}</span>
        </div>
        <dl className="scan-detail-grid">
          <div className="scan-detail-item">
            <dt>Manufacturer</dt>
            <dd>{asset.manufacturer}</dd>
          </div>
          <div className="scan-detail-item">
            <dt>Model</dt>
            <dd>{asset.model}</dd>
          </div>
          {asset.firmware_version && (
            <div className="scan-detail-item">
              <dt>Firmware</dt>
              <dd>{asset.firmware_version}</dd>
            </div>
          )}
          {asset.flight_hours != null && (
            <div className="scan-detail-item">
              <dt>Flight Hours</dt>
              <dd>{asset.flight_hours.toLocaleString()} hrs</dd>
            </div>
          )}
          {asset.battery_cycles != null && (
            <div className="scan-detail-item">
              <dt>Battery Cycles</dt>
              <dd>{asset.battery_cycles.toLocaleString()}</dd>
            </div>
          )}
        </dl>
      </div>

      <div className="scan-actions">
        {asset.status === 'available' && (
          <button className="btn-primary" onClick={onCheckOut}>
            Check Out
          </button>
        )}
        {asset.status === 'allocated' && (
          <>
            <button className="btn-primary" onClick={onCheckIn}>
              Check In
            </button>
            <button className="btn-secondary" disabled>
              Report Issue
            </button>
          </>
        )}
        <button className="btn-outline" onClick={onClear}>
          Clear
        </button>
      </div>
    </div>
  );
}
