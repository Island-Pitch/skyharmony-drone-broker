import { useState } from 'react';
import { RouteGuard } from '@/auth/RouteGuard';
import { useAuth } from '@/auth/useAuth';
import { Permission } from '@/auth/roles';
import { useIncidents } from '@/hooks/useIncidents';
import { useAssets } from '@/hooks/useAssets';
import type { IncidentSeverityValue } from '@/data/models/incident';
import posthog from '@/lib/posthog';

interface IncidentReportFormProps {
  prefilledAssetId?: string;
  prefilledBookingId?: string;
}

function IncidentReportFormInner({
  prefilledAssetId,
  prefilledBookingId,
}: IncidentReportFormProps) {
  const { user } = useAuth();
  const { reportIncident } = useIncidents();
  const { assets } = useAssets();

  const [assetId, setAssetId] = useState(prefilledAssetId ?? '');
  const [severity, setSeverity] = useState<IncidentSeverityValue>('cosmetic');
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [incidentRef, setIncidentRef] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!assetId) {
      newErrors.assetId = 'Asset is required';
    }
    if (!description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const incident = await reportIncident({
        asset_id: assetId,
        reporter_id: user.id,
        severity,
        description: description.trim(),
        booking_id: prefilledBookingId,
        photo_url: photoUrl || undefined,
      });
      posthog.capture('incident_form_submitted', {
        incident_id: incident.id,
        severity,
        asset_id: assetId,
        has_photo: !!photoUrl,
      });
      setIncidentRef(incident.id);
      setSubmitted(true);
    } catch (err) {
      posthog.captureException(err);
      setErrors({ submit: 'Failed to submit report' });
    }
  }

  if (submitted) {
    return (
      <div data-testid="incident-confirmation" className="confirmation-card">
        <h3>Incident Reported</h3>
        <p>
          Reference: <code>{incidentRef}</code>
        </p>
        {severity === 'critical' && (
          <p className="warning-text">
            This asset has been automatically grounded for maintenance.
          </p>
        )}
        <button
          className="btn-primary"
          onClick={() => {
            setSubmitted(false);
            setDescription('');
            setPhotoUrl('');
            setSeverity('cosmetic');
            setErrors({});
          }}
        >
          Report Another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="incident-form">
      <div className="form-group">
        <label htmlFor="incident-asset">Asset</label>
        <select
          id="incident-asset"
          value={assetId}
          onChange={(e) => setAssetId(e.target.value)}
        >
          <option value="">Select an asset...</option>
          {assets.map((a) => (
            <option key={a.id} value={a.id}>
              {a.serial_number} — {a.model}
            </option>
          ))}
        </select>
        {errors.assetId && (
          <span className="field-error">{errors.assetId}</span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="incident-severity">Severity</label>
        <select
          id="incident-severity"
          value={severity}
          onChange={(e) =>
            setSeverity(e.target.value as IncidentSeverityValue)
          }
        >
          <option value="cosmetic">Cosmetic</option>
          <option value="functional">Functional</option>
          <option value="critical">Critical</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="incident-description">Description</label>
        <textarea
          id="incident-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder="Describe the damage or incident..."
        />
        {errors.description && (
          <span className="field-error">{errors.description}</span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="incident-photo">Photo URL</label>
        <input
          id="incident-photo"
          type="text"
          value={photoUrl}
          onChange={(e) => setPhotoUrl(e.target.value)}
          placeholder="https://example.com/photo.jpg"
        />
      </div>

      {errors.submit && (
        <div className="field-error">{errors.submit}</div>
      )}

      <button type="submit" className="btn-primary">
        Submit Report
      </button>
    </form>
  );
}

export function IncidentReportForm(props: IncidentReportFormProps) {
  return (
    <RouteGuard permission={Permission.IncidentReport}>
      <IncidentReportFormInner {...props} />
    </RouteGuard>
  );
}
