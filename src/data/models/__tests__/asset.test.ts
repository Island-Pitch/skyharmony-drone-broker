import { describe, it, expect } from 'vitest';
import {
  AssetStatus,
  AssetSchema,
  AssetTypeSchema,
  CreateAssetInputSchema,
  UpdateAssetInputSchema,
  type AssetStatusValue,
} from '../asset';

describe('AssetStatus', () => {
  it('accepts valid status values', () => {
    const validStatuses: AssetStatusValue[] = [
      'available',
      'allocated',
      'in_transit',
      'maintenance',
      'retired',
    ];
    for (const status of validStatuses) {
      expect(AssetStatus.parse(status)).toBe(status);
    }
  });

  it('rejects invalid status values', () => {
    expect(() => AssetStatus.parse('invalid')).toThrow();
    expect(() => AssetStatus.parse('')).toThrow();
    expect(() => AssetStatus.parse(123)).toThrow();
  });
});

describe('AssetTypeSchema', () => {
  const validAssetType = {
    id: crypto.randomUUID(),
    name: 'drone',
    description: 'Unmanned aerial vehicle',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  it('validates a correct asset type', () => {
    const result = AssetTypeSchema.safeParse(validAssetType);
    expect(result.success).toBe(true);
  });

  it('rejects asset type with missing name', () => {
    const noName = { ...validAssetType } as Record<string, unknown>;
    delete noName.name;
    const result = AssetTypeSchema.safeParse(noName);
    expect(result.success).toBe(false);
  });

  it('rejects asset type with invalid UUID id', () => {
    const result = AssetTypeSchema.safeParse({ ...validAssetType, id: 'not-a-uuid' });
    expect(result.success).toBe(false);
  });
});

describe('AssetSchema', () => {
  const typeId = crypto.randomUUID();
  const validAsset = {
    id: crypto.randomUUID(),
    asset_type_id: typeId,
    serial_number: 'VA-2024-001',
    manufacturer: 'Verge Aero',
    model: 'X1',
    status: 'available' as const,
    firmware_version: '4.2.1',
    flight_hours: 0,
    battery_cycles: 0,
    typed_attributes: {},
    current_operator_id: null,
    parent_asset_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  it('validates a correct drone asset', () => {
    const result = AssetSchema.safeParse(validAsset);
    expect(result.success).toBe(true);
  });

  it('validates an asset with typed_attributes', () => {
    const withAttrs = {
      ...validAsset,
      typed_attributes: { max_altitude: 400, payload_capacity_kg: 2.5 },
    };
    const result = AssetSchema.safeParse(withAttrs);
    expect(result.success).toBe(true);
  });

  it('validates an asset with parent_asset_id (accessory)', () => {
    const accessory = {
      ...validAsset,
      parent_asset_id: crypto.randomUUID(),
    };
    const result = AssetSchema.safeParse(accessory);
    expect(result.success).toBe(true);
  });

  it('validates an asset with current_operator_id', () => {
    const allocated = {
      ...validAsset,
      status: 'allocated' as const,
      current_operator_id: crypto.randomUUID(),
    };
    const result = AssetSchema.safeParse(allocated);
    expect(result.success).toBe(true);
  });

  it('rejects negative flight_hours', () => {
    const result = AssetSchema.safeParse({ ...validAsset, flight_hours: -10 });
    expect(result.success).toBe(false);
  });

  it('rejects negative battery_cycles', () => {
    const result = AssetSchema.safeParse({ ...validAsset, battery_cycles: -1 });
    expect(result.success).toBe(false);
  });

  it('rejects fractional battery_cycles', () => {
    const result = AssetSchema.safeParse({ ...validAsset, battery_cycles: 1.5 });
    expect(result.success).toBe(false);
  });

  it('rejects missing serial_number', () => {
    const noSerial = { ...validAsset } as Record<string, unknown>;
    delete noSerial.serial_number;
    const result = AssetSchema.safeParse(noSerial);
    expect(result.success).toBe(false);
  });

  it('rejects invalid status', () => {
    const result = AssetSchema.safeParse({ ...validAsset, status: 'flying' });
    expect(result.success).toBe(false);
  });

  it('allows optional fields to be undefined', () => {
    const minimal = {
      id: crypto.randomUUID(),
      asset_type_id: typeId,
      serial_number: 'VA-2024-002',
      manufacturer: 'Verge Aero',
      model: 'X1',
      status: 'available' as const,
      typed_attributes: {},
      current_operator_id: null,
      parent_asset_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const result = AssetSchema.safeParse(minimal);
    expect(result.success).toBe(true);
  });
});

describe('CreateAssetInputSchema', () => {
  it('validates a create input (no id, no timestamps)', () => {
    const input = {
      asset_type_id: crypto.randomUUID(),
      serial_number: 'VA-2024-003',
      manufacturer: 'Verge Aero',
      model: 'X1',
      typed_attributes: {},
    };
    const result = CreateAssetInputSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('rejects create input with missing required fields', () => {
    const result = CreateAssetInputSchema.safeParse({ manufacturer: 'Verge Aero' });
    expect(result.success).toBe(false);
  });

  it('allows optional fields in create input', () => {
    const input = {
      asset_type_id: crypto.randomUUID(),
      serial_number: 'VA-2024-004',
      manufacturer: 'Verge Aero',
      model: 'X1',
      typed_attributes: {},
      firmware_version: '4.2.1',
      flight_hours: 0,
      battery_cycles: 0,
      parent_asset_id: crypto.randomUUID(),
    };
    const result = CreateAssetInputSchema.safeParse(input);
    expect(result.success).toBe(true);
  });
});

describe('UpdateAssetInputSchema', () => {
  it('validates a partial update (status only)', () => {
    const result = UpdateAssetInputSchema.safeParse({ status: 'maintenance' });
    expect(result.success).toBe(true);
  });

  it('validates a partial update (attributes only)', () => {
    const result = UpdateAssetInputSchema.safeParse({
      typed_attributes: { max_altitude: 500 },
    });
    expect(result.success).toBe(true);
  });

  it('rejects update with invalid status', () => {
    const result = UpdateAssetInputSchema.safeParse({ status: 'invalid' });
    expect(result.success).toBe(false);
  });

  it('accepts empty update (no fields)', () => {
    const result = UpdateAssetInputSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});
