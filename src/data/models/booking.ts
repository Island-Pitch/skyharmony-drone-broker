import { z } from 'zod';

/** Valid lifecycle states for a booking request. */
export const BookingStatus = z.enum([
  'pending',
  'allocated',
  'confirmed',
  'completed',
  'cancelled',
]);

export type BookingStatusValue = z.infer<typeof BookingStatus>;

/** Schema for a requested asset entry (asset type + count). */
export const RequestedAssetSchema = z.object({
  asset_type_id: z.string().uuid(),
  count: z.number().int().positive(),
});

export type RequestedAsset = z.infer<typeof RequestedAssetSchema>;

/** Booking record schema. */
export const BookingSchema = z.object({
  id: z.string().uuid(),
  operator_id: z.string().uuid(),
  operator_name: z.string(),
  show_date: z.string().datetime(),
  end_date: z.string().datetime().optional(),
  drone_count: z.number().int().positive(),
  location: z.string(),
  status: BookingStatus,
  notes: z.string().optional(),
  allocated_assets: z.array(z.string().uuid()).default([]),
  requested_assets: z.array(RequestedAssetSchema).default([]),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Booking = z.infer<typeof BookingSchema>;

/** Input schema for creating a new booking — no id, status, or timestamps (server-generated). */
export const CreateBookingInputSchema = z.object({
  operator_id: z.string().uuid(),
  operator_name: z.string(),
  show_date: z.string().datetime(),
  end_date: z.string().datetime().optional(),
  drone_count: z.number().int().positive(),
  location: z.string(),
  notes: z.string().optional(),
  requested_assets: z.array(RequestedAssetSchema).optional(),
});

export type CreateBookingInput = z.infer<typeof CreateBookingInputSchema>;

/** Input schema for updating a booking — all fields optional for partial update. */
export const UpdateBookingInputSchema = z.object({
  show_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  drone_count: z.number().int().positive().optional(),
  location: z.string().optional(),
  status: BookingStatus.optional(),
  notes: z.string().optional(),
  allocated_assets: z.array(z.string().uuid()).optional(),
});

export type UpdateBookingInput = z.infer<typeof UpdateBookingInputSchema>;
