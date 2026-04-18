import { z } from 'zod';

/** Audit event recorded when an asset field changes value. */
export const AuditEventSchema = z.object({
  id: z.string().uuid(),
  asset_id: z.string().uuid(),
  field_changed: z.string(),
  old_value: z.string().nullable(),
  new_value: z.string(),
  changed_by: z.string().uuid(),
  changed_at: z.string().datetime(),
});

export type AuditEvent = z.infer<typeof AuditEventSchema>;
