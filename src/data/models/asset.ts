import { z } from 'zod';

/** Valid lifecycle states for any asset in the catalog. */
export const AssetStatus = z.enum([
  'available',
  'allocated',
  'in_transit',
  'maintenance',
  'retired',
]);

export type AssetStatusValue = z.infer<typeof AssetStatus>;

/** Config-driven asset type (e.g. "drone", "battery"). Adding a new type requires zero code changes. */
export const AssetTypeSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type AssetType = z.infer<typeof AssetTypeSchema>;

/** Polymorphic asset record. Drones are Type 1; base stations, batteries, etc. follow the same shape. */
export const AssetSchema = z.object({
  id: z.string().uuid(),
  asset_type_id: z.string().uuid(),
  serial_number: z.string(),
  manufacturer: z.string(),
  model: z.string(),
  status: AssetStatus,
  firmware_version: z.string().optional(),
  flight_hours: z.number().nonnegative().optional(),
  battery_cycles: z.number().int().nonnegative().optional(),
  typed_attributes: z.record(z.string(), z.any()),
  current_operator_id: z.string().uuid().nullable(),
  parent_asset_id: z.string().uuid().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Asset = z.infer<typeof AssetSchema>;

/** Input schema for POST /fleet — no id or timestamps (server-generated). */
export const CreateAssetInputSchema = z.object({
  asset_type_id: z.string().uuid(),
  serial_number: z.string(),
  manufacturer: z.string(),
  model: z.string(),
  typed_attributes: z.record(z.string(), z.any()),
  firmware_version: z.string().optional(),
  flight_hours: z.number().nonnegative().optional(),
  battery_cycles: z.number().int().nonnegative().optional(),
  parent_asset_id: z.string().uuid().optional(),
});

export type CreateAssetInput = z.infer<typeof CreateAssetInputSchema>;

/** Input schema for PATCH /fleet/:id — all fields optional for partial update. */
export const UpdateAssetInputSchema = z.object({
  status: AssetStatus.optional(),
  firmware_version: z.string().optional(),
  flight_hours: z.number().nonnegative().optional(),
  battery_cycles: z.number().int().nonnegative().optional(),
  typed_attributes: z.record(z.string(), z.any()).optional(),
  current_operator_id: z.string().uuid().nullable().optional(),
  parent_asset_id: z.string().uuid().nullable().optional(),
});

export type UpdateAssetInput = z.infer<typeof UpdateAssetInputSchema>;
