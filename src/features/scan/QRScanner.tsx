import { useState, type FormEvent } from 'react';
import './scan.css';

interface QRScannerProps {
  onScan: (serial: string) => void;
  scanning: boolean;
}

/** Manual serial number entry scanner (mock QR scanner for demo). */
export function QRScanner({ onScan, scanning }: QRScannerProps) {
  const [serial, setSerial] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = serial.trim();
    if (trimmed) {
      onScan(trimmed);
    }
  };

  return (
    <div className="qr-scanner">
      <div className="scan-frame">
        <div className="scan-frame-corner top-left" />
        <div className="scan-frame-corner top-right" />
        <div className="scan-frame-corner bottom-left" />
        <div className="scan-frame-corner bottom-right" />
        <div className="scan-frame-content">
          <p className="scan-instruction">
            Enter serial number or scan QR code
          </p>
        </div>
      </div>
      <form className="scan-form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="scan-input"
          placeholder="e.g. VE-0001"
          value={serial}
          onChange={(e) => setSerial(e.target.value)}
          aria-label="Serial number"
          disabled={scanning}
        />
        <button
          type="submit"
          className="btn-primary scan-btn"
          disabled={scanning || !serial.trim()}
        >
          {scanning ? 'Scanning...' : 'Scan'}
        </button>
      </form>
    </div>
  );
}
