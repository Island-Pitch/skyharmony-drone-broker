import { useState, useEffect, useRef, useCallback, type FormEvent } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import './scan.css';

interface QRScannerProps {
  onScan: (serial: string) => void;
  scanning: boolean;
}

export function QRScanner({ onScan, scanning }: QRScannerProps) {
  const [serial, setSerial] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const stopCamera = useCallback(async () => {
    if (scannerRef.current?.isScanning) {
      try {
        await scannerRef.current.stop();
      } catch {
        // Already stopped
      }
    }
    setCameraActive(false);
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError('');
    if (!containerRef.current) return;

    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode('qr-reader');
      }

      await scannerRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        (decodedText) => {
          // QR decoded — extract serial from the text
          // QR might contain just the serial or a URL with the serial
          const serial = decodedText.replace(/.*serial[=:]?/i, '').trim();
          onScan(serial || decodedText);
          stopCamera();
        },
        () => {
          // QR scan error (no QR found in frame) — ignore
        },
      );

      setCameraActive(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Camera access denied';
      setCameraError(msg.includes('NotAllowedError')
        ? 'Camera permission denied. Please allow camera access in your browser settings.'
        : msg.includes('NotFoundError')
          ? 'No camera found. Use manual entry below.'
          : `Camera error: ${msg}`
      );
    }
  }, [onScan, stopCamera]);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = serial.trim();
    if (trimmed) {
      onScan(trimmed);
    }
  };

  return (
    <div className="qr-scanner">
      <div className="scan-frame" ref={containerRef}>
        {cameraActive ? (
          <div className="camera-container">
            <div id="qr-reader" className="qr-reader-element" />
            <button type="button" className="camera-stop-btn" onClick={stopCamera}>
              Stop Camera
            </button>
          </div>
        ) : (
          <div className="scan-frame-content">
            <div className="scan-frame-corner top-left" />
            <div className="scan-frame-corner top-right" />
            <div className="scan-frame-corner bottom-left" />
            <div className="scan-frame-corner bottom-right" />

            <button
              type="button"
              className="camera-start-btn"
              onClick={startCamera}
              disabled={scanning}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              <span>Tap to Scan QR Code</span>
            </button>

            {cameraError && (
              <p className="camera-error">{cameraError}</p>
            )}

            <p className="scan-instruction">
              Or enter serial number manually below
            </p>
          </div>
        )}
      </div>

      <form className="scan-form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="scan-input"
          placeholder="e.g. VE-0001"
          value={serial}
          onChange={(e) => setSerial(e.target.value)}
          aria-label="Serial number"
          disabled={scanning || cameraActive}
        />
        <button
          type="submit"
          className="btn-primary scan-btn"
          disabled={scanning || !serial.trim() || cameraActive}
        >
          {scanning ? 'Looking up...' : 'Look Up'}
        </button>
      </form>
    </div>
  );
}
