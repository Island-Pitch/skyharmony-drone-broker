import { useState, useEffect, useRef, useCallback, type FormEvent } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import './scan.css';

interface CameraDevice {
  id: string;
  label: string;
}

interface QRScannerProps {
  onScan: (serial: string) => void;
  scanning: boolean;
}

export function QRScanner({ onScan, scanning }: QRScannerProps) {
  const [serial, setSerial] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
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

  const [pendingStart, setPendingStart] = useState(false);

  const startCamera = useCallback(async () => {
    setCameraError('');
    if (!containerRef.current) return;

    try {
      // Request camera permission explicitly before enumerating
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((t) => t.stop());

      // Enumerate cameras after permission is granted
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices
        .filter((d) => d.kind === 'videoinput')
        .map((d, i) => ({ id: d.deviceId, label: d.label || `Camera ${i + 1}` }));

      setCameras(videoDevices);

      // Default to environment-facing camera if available, otherwise first camera
      const envCamera = videoDevices.find(
        (d) => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('environment'),
      );
      const defaultId = envCamera?.id || videoDevices[0]?.id || '';
      if (!selectedCameraId) setSelectedCameraId(defaultId);

      setCameraActive(true);
      setPendingStart(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setCameraError(msg.includes('NotAllowedError') || msg.includes('Permission denied')
        ? 'Camera permission denied. Please allow camera access in your browser settings.'
        : msg.includes('NotFoundError') || msg.includes('Requested device not found')
          ? 'No camera found. Use manual entry below.'
          : `Camera error: ${msg}`
      );
    }
  }, [selectedCameraId]);

  // Start the scanner after the qr-reader div is rendered
  useEffect(() => {
    if (!pendingStart || !cameraActive) return;
    setPendingStart(false);

    const cameraId = selectedCameraId;

    (async () => {
      try {
        // Stop existing scanner if switching cameras
        if (scannerRef.current?.isScanning) {
          await scannerRef.current.stop();
        }

        if (!scannerRef.current) {
          scannerRef.current = new Html5Qrcode('qr-reader');
        }

        const cameraConfig = cameraId
          ? { deviceId: { exact: cameraId } }
          : { facingMode: 'environment' };

        await scannerRef.current.start(
          cameraConfig,
          { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1 },
          (decodedText) => {
            const serial = decodedText.replace(/.*serial[=:]?/i, '').trim();
            onScan(serial || decodedText);
            stopCamera();
          },
          () => {},
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setCameraError(`Camera error: ${msg}`);
        setCameraActive(false);
      }
    })();
  }, [pendingStart, cameraActive, selectedCameraId, onScan, stopCamera]);

  const switchCamera = useCallback((deviceId: string) => {
    setSelectedCameraId(deviceId);
    setPendingStart(true);
  }, []);

  useEffect(() => {
    return () => {
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
            <div className="camera-controls">
              {cameras.length > 1 && (
                <select
                  className="camera-select"
                  value={selectedCameraId}
                  onChange={(e) => switchCamera(e.target.value)}
                >
                  {cameras.map((cam) => (
                    <option key={cam.id} value={cam.id}>{cam.label}</option>
                  ))}
                </select>
              )}
              <button type="button" className="camera-stop-btn" onClick={stopCamera}>
                Stop Camera
              </button>
            </div>
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
