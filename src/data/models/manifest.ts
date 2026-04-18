import { z } from 'zod';

/** Lifecycle states for a logistics manifest. */
export const ManifestStatus = z.enum(['draft', 'in_transit', 'delivered', 'complete']);

export type ManifestStatusValue = z.infer<typeof ManifestStatus>;

/** Lifecycle states for a transport leg. */
export const LegStatus = z.enum(['pending', 'loading', 'in_transit', 'unloading', 'complete']);

export type LegStatusValue = z.infer<typeof LegStatus>;

/** Transport leg record. */
export const TransportLegSchema = z.object({
  id: z.string().uuid(),
  manifest_id: z.string().uuid(),
  leg_number: z.number().int(),
  origin: z.string().nullable(),
  destination: z.string().nullable(),
  status: LegStatus,
  driver_name: z.string().nullable(),
  vehicle_info: z.string().nullable(),
  departed_at: z.string().nullable(),
  arrived_at: z.string().nullable(),
  created_at: z.string().nullable(),
});

export type TransportLeg = z.infer<typeof TransportLegSchema>;

/** Full manifest record. */
export const ManifestSchema = z.object({
  id: z.string().uuid(),
  booking_id: z.string().uuid().nullable(),
  status: ManifestStatus,
  created_by: z.string().uuid().nullable(),
  assets: z.array(z.string().uuid()).default([]),
  pickup_location: z.string().nullable(),
  delivery_location: z.string().nullable(),
  pickup_date: z.string().nullable(),
  delivery_date: z.string().nullable(),
  notes: z.string().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});

export type Manifest = z.infer<typeof ManifestSchema>;

/** Manifest with legs and asset details included (from detail endpoint). */
export interface ManifestDetail extends Manifest {
  legs: TransportLeg[];
  asset_details: Array<{
    id: string;
    serial_number: string;
    manufacturer: string;
    model: string;
    status: string;
  }>;
}

/** Input for creating a manifest. */
export interface CreateManifestInput {
  booking_id: string;
  pickup_location: string;
  delivery_location: string;
  pickup_date: string;
  delivery_date: string;
  notes?: string;
}

/** Input for adding a transport leg. */
export interface CreateLegInput {
  origin: string;
  destination: string;
  driver_name?: string;
  vehicle_info?: string;
}

/** Input for updating a transport leg status. */
export interface UpdateLegInput {
  status: LegStatusValue;
  driver_name?: string;
  vehicle_info?: string;
}
