import type { Asset, AssetType, CreateAssetInput } from '@/data/models/asset';
import type { Booking, CreateBookingInput } from '@/data/models/booking';

let counter = 0;

export function createMockAssetType(
  overrides: Partial<AssetType> = {},
): AssetType {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name: `type-${++counter}`,
    description: `Test asset type ${counter}`,
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

export function createMockAsset(
  assetTypeId: string,
  overrides: Partial<Asset> = {},
): Asset {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    asset_type_id: assetTypeId,
    serial_number: `TEST-${++counter}`,
    manufacturer: 'Test Manufacturer',
    model: 'Test Model',
    status: 'available',
    typed_attributes: {},
    current_operator_id: null,
    parent_asset_id: null,
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

export function createMockCreateInput(
  assetTypeId: string,
  overrides: Partial<CreateAssetInput> = {},
): CreateAssetInput {
  return {
    asset_type_id: assetTypeId,
    serial_number: `TEST-${++counter}`,
    manufacturer: 'Test Manufacturer',
    model: 'Test Model',
    typed_attributes: {},
    ...overrides,
  };
}

export function createMockBooking(
  overrides: Partial<Booking> = {},
): Booking {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    operator_id: crypto.randomUUID(),
    operator_name: `Operator-${++counter}`,
    show_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    drone_count: 50,
    location: 'Test Location',
    status: 'pending',
    allocated_assets: [],
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

export function createMockBookingInput(
  overrides: Partial<CreateBookingInput> = {},
): CreateBookingInput {
  return {
    operator_id: crypto.randomUUID(),
    operator_name: `Operator-${++counter}`,
    show_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    drone_count: 50,
    location: 'Test Location',
    ...overrides,
  };
}
