import { useState, useEffect, useContext, useCallback } from 'react';
import { DataContext } from '@/providers/DataProvider';
import type { Asset } from '@/data/models/asset';
import './scan.css';

interface ManifestReconciliationProps {
  onScanSerial: (serial: string) => void;
}

/** Shows manifest reconciliation progress — tracks which assets have been scanned. */
export function ManifestReconciliation({ onScanSerial }: ManifestReconciliationProps) {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('ManifestReconciliation must be used within a DataProvider');

  const { assetService, scanService } = ctx;
  const [manifest, setManifest] = useState<Asset[]>([]);
  const [scannedSerials, setScannedSerials] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Build a mock manifest from the first 20 drones
  useEffect(() => {
    const loadManifest = async () => {
      const allAssets = await assetService.listAssets();
      // Pick 20 drones (assets with serial numbers matching the drone pattern)
      const drones = allAssets
        .filter((a) => /^[A-Z]{2}-\d{4}$/.test(a.serial_number))
        .slice(0, 20);
      setManifest(drones);
      setLoading(false);
    };
    loadManifest();
  }, [assetService]);

  const refreshScanned = useCallback(async () => {
    const scanned = new Set<string>();
    for (const asset of manifest) {
      const events = await scanService.getCustodyHistory(asset.id);
      if (events.length > 0) {
        scanned.add(asset.serial_number);
      }
    }
    setScannedSerials(scanned);
  }, [manifest, scanService]);

  useEffect(() => {
    if (manifest.length > 0) {
      refreshScanned();
    }
  }, [manifest, refreshScanned]);

  if (loading) {
    return <div className="manifest-loading">Loading manifest...</div>;
  }

  const total = manifest.length;
  const scannedCount = scannedSerials.size;
  const percentage = total > 0 ? Math.round((scannedCount / total) * 100) : 0;
  const fullyReconciled = scannedCount === total && total > 0;

  return (
    <div className="manifest-reconciliation">
      <h3>Manifest Reconciliation</h3>

      <div className="manifest-progress">
        <div className="manifest-progress-header">
          <span>
            {scannedCount} / {total} scanned
          </span>
          <span>{percentage}%</span>
        </div>
        <div className="progress-bar" role="progressbar" aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100}>
          <div
            className={`progress-fill ${fullyReconciled ? 'progress-fill-complete' : ''}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {fullyReconciled && (
        <div className="manifest-complete" role="status">
          Fully Reconciled
        </div>
      )}

      {!fullyReconciled && (
        <div className="manifest-unscanned">
          <h4>Unscanned Assets</h4>
          <ul className="manifest-list">
            {manifest
              .filter((a) => !scannedSerials.has(a.serial_number))
              .map((a) => (
                <li key={a.id} className="manifest-item">
                  <span className="manifest-serial">{a.serial_number}</span>
                  <span className="manifest-model">
                    {a.manufacturer} {a.model}
                  </span>
                  <button
                    className="btn-outline btn-small"
                    onClick={() => onScanSerial(a.serial_number)}
                  >
                    Scan
                  </button>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}
