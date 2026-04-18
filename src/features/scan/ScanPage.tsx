import { useCallback } from 'react';
import { RouteGuard } from '@/auth/RouteGuard';
import { useAuth } from '@/auth/useAuth';
import { Permission } from '@/auth/roles';
import { useScan } from '@/hooks/useScan';
import { QRScanner } from './QRScanner';
import { ScanResult } from './ScanResult';
import { ManifestReconciliation } from './ManifestReconciliation';
import './scan.css';

/** Scan page combining QR scanner, scan result, and manifest reconciliation. */
export function ScanPage() {
  return (
    <RouteGuard permission={Permission.ScanCheckIn}>
      <ScanPageContent />
    </RouteGuard>
  );
}

function ScanPageContent() {
  const { user } = useAuth();
  const {
    scanResult,
    scanning,
    error,
    notFound,
    lastAction,
    actionSuccess,
    scan,
    checkOut,
    checkIn,
    clearResult,
  } = useScan();

  const handleScan = useCallback(
    (serial: string) => {
      scan(serial);
    },
    [scan],
  );

  const handleCheckOut = useCallback(() => {
    if (scanResult) {
      checkOut(scanResult.serial_number, user.id);
    }
  }, [scanResult, checkOut, user.id]);

  const handleCheckIn = useCallback(() => {
    if (scanResult) {
      checkIn(scanResult.serial_number, user.id);
    }
  }, [scanResult, checkIn, user.id]);

  return (
    <div className="page scan-page">
      <h2>Scan Check-In / Check-Out</h2>

      <div className="scan-layout">
        <div className="scan-main">
          <QRScanner onScan={handleScan} scanning={scanning} />
          <ScanResult
            asset={scanResult}
            notFound={notFound}
            error={error}
            lastAction={lastAction}
            actionSuccess={actionSuccess}
            onCheckOut={handleCheckOut}
            onCheckIn={handleCheckIn}
            onClear={clearResult}
          />
        </div>

        <div className="scan-sidebar">
          <ManifestReconciliation onScanSerial={handleScan} />
        </div>
      </div>
    </div>
  );
}
