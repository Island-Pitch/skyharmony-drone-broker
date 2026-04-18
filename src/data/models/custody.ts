import { z } from 'zod';

/** Valid custody actions for check-in / check-out flow. */
export const CustodyAction = z.enum(['check_out', 'check_in']);

export type CustodyActionValue = z.infer<typeof CustodyAction>;

/** Custody event recorded when an asset is checked in or out. */
export const CustodyEventSchema = z.object({
  id: z.string().uuid(),
  asset_id: z.string().uuid(),
  action: CustodyAction,
  actor_id: z.string().uuid(),
  booking_id: z.string().uuid().optional(),
  mac_address: z.string().optional(),
  timestamp: z.string().datetime(),
  notes: z.string().optional(),
});

export type CustodyEvent = z.infer<typeof CustodyEventSchema>;
