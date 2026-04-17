import { z } from 'zod';

export const AssetStatus = z.enum([
  'available',
  'allocated',
  'in_transit',
  'maintenance',
  'retired',
]);

export type AssetStatusValue = z.infer<typeof AssetStatus>;

export const AssetTypeSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type AssetType = z.infer<typeof AssetTypeSchema>;

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
