import { z } from 'zod';

/** Severity levels for damage/incident reports. */
export const IncidentSeverity = z.enum(['cosmetic', 'functional', 'critical']);

export type IncidentSeverityValue = z.infer<typeof IncidentSeverity>;

/** Lifecycle states for an incident report. */
export const IncidentStatus = z.enum(['open', 'resolved', 'maintenance_created']);

export type IncidentStatusValue = z.infer<typeof IncidentStatus>;

/** Full incident record. */
export const IncidentSchema = z.object({
  id: z.string().uuid(),
  asset_id: z.string().uuid(),
  booking_id: z.string().uuid().optional(),
  reporter_id: z.string().uuid(),
  severity: IncidentSeverity,
  description: z.string(),
  photo_url: z.string().optional(),
  status: IncidentStatus,
  resolution_notes: z.string().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Incident = z.infer<typeof IncidentSchema>;

/** Input schema for creating a new incident — no id, status, or timestamps. */
export const CreateIncidentInputSchema = z.object({
  asset_id: z.string().uuid(),
  booking_id: z.string().uuid().optional(),
  reporter_id: z.string().uuid(),
  severity: IncidentSeverity,
  description: z.string(),
  photo_url: z.string().optional(),
});

export type CreateIncidentInput = z.infer<typeof CreateIncidentInputSchema>;

/** Input schema for updating an incident — all fields optional. */
export const UpdateIncidentInputSchema = z.object({
  status: IncidentStatus.optional(),
  resolution_notes: z.string().optional(),
});

export type UpdateIncidentInput = z.infer<typeof UpdateIncidentInputSchema>;
