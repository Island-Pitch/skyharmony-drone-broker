import { store } from './store';
import { operators } from './operators';
import type { Asset, AssetType, AssetStatusValue } from './models/asset';
import type { Booking, BookingStatusValue } from './models/booking';

const MANUFACTURERS = [
  { name: 'Verge Aero', models: ['X1', 'X1-Pro', 'X7'] },
  { name: 'DJI Enterprise', models: ['M30', 'M30T', 'Matrice 350'] },
  { name: 'Skydio', models: ['X10', 'X10D', 'S2+'] },
  { name: 'Autel Robotics', models: ['EVO Max', 'EVO II Pro', 'Dragonfish'] },
];

const STATUS_DISTRIBUTION: { status: AssetStatusValue; weight: number }[] = [
  { status: 'available', weight: 60 },
  { status: 'allocated', weight: 15 },
  { status: 'in_transit', weight: 10 },
  { status: 'maintenance', weight: 10 },
  { status: 'retired', weight: 5 },
];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

function pickWeighted<T extends { weight: number }>(
  items: T[],
  rand: () => number,
): T {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let r = rand() * total;
  for (const item of items) {
    r -= item.weight;
    if (r <= 0) return item;
  }
  return items[items.length - 1]!;
}

/** Populate the global store with deterministic seed data (500+ drones + accessories). */
export function seedStore(): void {
  const rand = seededRandom(42);

  // Create asset types
  const droneType: AssetType = {
    id: '00000000-0000-4000-8000-000000000001',
    name: 'drone',
    description: 'Unmanned aerial vehicle',
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
  };
  const batteryType: AssetType = {
    id: '00000000-0000-4000-8000-000000000002',
    name: 'battery',
    description: 'Rechargeable battery pack',
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
  };
  const chargerType: AssetType = {
    id: '00000000-0000-4000-8000-000000000003',
    name: 'charger',
    description: 'Battery charging station',
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
  };
  const baseStationType: AssetType = {
    id: '00000000-0000-4000-8000-000000000004',
    name: 'base_station',
    description: 'Ground control base station',
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
  };

  store.assetTypes.set(droneType.id, droneType);
  store.assetTypes.set(batteryType.id, batteryType);
  store.assetTypes.set(chargerType.id, chargerType);
  store.assetTypes.set(baseStationType.id, baseStationType);

  // Generate 500 drones distributed across named operators
  let droneIndex = 0;
  for (let opIdx = 0; opIdx < operators.length; opIdx++) {
    const op = operators[opIdx]!;
    for (let d = 0; d < op.drone_count; d++) {
      droneIndex++;
      const i = droneIndex;
      const mfrIdx = Math.floor(rand() * MANUFACTURERS.length);
      const mfr = MANUFACTURERS[mfrIdx]!;
      const modelIdx = Math.floor(rand() * mfr.models.length);
      const model = mfr.models[modelIdx]!;
      const statusEntry = pickWeighted(STATUS_DISTRIBUTION, rand);
      const flightHours = Math.floor(rand() * 2000);
      const batteryCycles = Math.floor(rand() * 500);

      const drone: Asset = {
        id: crypto.randomUUID(),
        asset_type_id: droneType.id,
        serial_number: `${mfr.name.substring(0, 2).toUpperCase()}-${String(i).padStart(4, '0')}`,
        manufacturer: mfr.name,
        model,
        status: statusEntry.status,
        firmware_version: `${Math.floor(rand() * 5 + 1)}.${Math.floor(rand() * 10)}.${Math.floor(rand() * 20)}`,
        flight_hours: flightHours,
        battery_cycles: batteryCycles,
        typed_attributes: {
          max_altitude_ft: Math.floor(rand() * 400 + 100),
          payload_capacity_kg: Math.round(rand() * 10 * 10) / 10,
        },
        current_operator_id: op.id,
        parent_asset_id: null,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: new Date().toISOString(),
      };
      store.assets.set(drone.id, drone);

      // Add 1-3 batteries per drone
      const numBatteries = Math.floor(rand() * 3) + 1;
      for (let b = 0; b < numBatteries; b++) {
        const battery: Asset = {
          id: crypto.randomUUID(),
          asset_type_id: batteryType.id,
          serial_number: `BAT-${String(i).padStart(4, '0')}-${b + 1}`,
          manufacturer: mfr.name,
          model: 'LiPo 5200mAh',
          status: drone.status === 'retired' ? 'retired' : 'available',
          battery_cycles: Math.floor(rand() * 300),
          typed_attributes: { capacity_mah: 5200 },
          current_operator_id: null,
          parent_asset_id: drone.id,
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: new Date().toISOString(),
        };
        store.assets.set(battery.id, battery);
      }
    }
  }

  // Add 20 base stations
  for (let i = 1; i <= 20; i++) {
    const bs: Asset = {
      id: crypto.randomUUID(),
      asset_type_id: baseStationType.id,
      serial_number: `BS-${String(i).padStart(3, '0')}`,
      manufacturer: 'DJI Enterprise',
      model: 'RC Plus',
      status: 'available',
      typed_attributes: { range_km: 15 },
      current_operator_id: null,
      parent_asset_id: null,
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: new Date().toISOString(),
    };
    store.assets.set(bs.id, bs);
  }

  // Add 10 chargers
  for (let i = 1; i <= 10; i++) {
    const charger: Asset = {
      id: crypto.randomUUID(),
      asset_type_id: chargerType.id,
      serial_number: `CHG-${String(i).padStart(3, '0')}`,
      manufacturer: 'Verge Aero',
      model: 'Fast Charger 8-Bay',
      status: 'available',
      typed_attributes: { bays: 8 },
      current_operator_id: null,
      parent_asset_id: null,
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: new Date().toISOString(),
    };
    store.assets.set(charger.id, charger);
  }

  // Seed 24 sample bookings with realistic CA/AZ/NV locations
  const sampleBookings: { operatorName: string; operatorId: string; status: BookingStatusValue; daysFromNow: number; drones: number; location: string }[] = [
    // NightBrite Drones — Southern California
    { operatorName: 'NightBrite Drones', operatorId: operators[0]!.id, status: 'confirmed', daysFromNow: 5, drones: 100, location: 'Los Angeles, CA' },
    { operatorName: 'NightBrite Drones', operatorId: operators[0]!.id, status: 'pending', daysFromNow: 18, drones: 60, location: 'San Diego, CA' },
    { operatorName: 'NightBrite Drones', operatorId: operators[0]!.id, status: 'allocated', daysFromNow: 10, drones: 80, location: 'Anaheim, CA' },
    { operatorName: 'NightBrite Drones', operatorId: operators[0]!.id, status: 'completed', daysFromNow: -7, drones: 50, location: 'Long Beach, CA' },
    { operatorName: 'NightBrite Drones', operatorId: operators[0]!.id, status: 'pending', daysFromNow: 25, drones: 40, location: 'Palm Springs, CA' },
    // Orion Skies — Northern California
    { operatorName: 'Orion Skies', operatorId: operators[1]!.id, status: 'pending', daysFromNow: 14, drones: 90, location: 'San Francisco, CA' },
    { operatorName: 'Orion Skies', operatorId: operators[1]!.id, status: 'confirmed', daysFromNow: 7, drones: 70, location: 'Sacramento, CA' },
    { operatorName: 'Orion Skies', operatorId: operators[1]!.id, status: 'allocated', daysFromNow: 21, drones: 110, location: 'San Jose, CA' },
    { operatorName: 'Orion Skies', operatorId: operators[1]!.id, status: 'completed', daysFromNow: -14, drones: 45, location: 'Oakland, CA' },
    // Vegas Drone Works — Nevada
    { operatorName: 'Vegas Drone Works', operatorId: operators[2]!.id, status: 'confirmed', daysFromNow: 3, drones: 200, location: 'Las Vegas, NV' },
    { operatorName: 'Vegas Drone Works', operatorId: operators[2]!.id, status: 'pending', daysFromNow: 30, drones: 150, location: 'Reno, NV' },
    { operatorName: 'Vegas Drone Works', operatorId: operators[2]!.id, status: 'allocated', daysFromNow: 12, drones: 80, location: 'Henderson, NV' },
    { operatorName: 'Vegas Drone Works', operatorId: operators[2]!.id, status: 'cancelled', daysFromNow: -3, drones: 30, location: 'Las Vegas Strip, NV' },
    { operatorName: 'Vegas Drone Works', operatorId: operators[2]!.id, status: 'pending', daysFromNow: 45, drones: 120, location: 'Laughlin, NV' },
    // Patriotic Air — Arizona
    { operatorName: 'Patriotic Air', operatorId: operators[3]!.id, status: 'pending', daysFromNow: 20, drones: 100, location: 'Phoenix, AZ' },
    { operatorName: 'Patriotic Air', operatorId: operators[3]!.id, status: 'confirmed', daysFromNow: 8, drones: 75, location: 'Scottsdale, AZ' },
    { operatorName: 'Patriotic Air', operatorId: operators[3]!.id, status: 'allocated', daysFromNow: 15, drones: 60, location: 'Tucson, AZ' },
    { operatorName: 'Patriotic Air', operatorId: operators[3]!.id, status: 'completed', daysFromNow: -21, drones: 40, location: 'Sedona, AZ' },
    { operatorName: 'Patriotic Air', operatorId: operators[3]!.id, status: 'cancelled', daysFromNow: -10, drones: 25, location: 'Tempe, AZ' },
    // Sky Harmony Fleet — Southwest US
    { operatorName: 'Sky Harmony Fleet', operatorId: operators[4]!.id, status: 'pending', daysFromNow: 35, drones: 300, location: 'Coachella Valley, CA' },
    { operatorName: 'Sky Harmony Fleet', operatorId: operators[4]!.id, status: 'confirmed', daysFromNow: 4, drones: 120, location: 'Lake Havasu, AZ' },
    { operatorName: 'Sky Harmony Fleet', operatorId: operators[4]!.id, status: 'allocated', daysFromNow: 9, drones: 80, location: 'Boulder City, NV' },
    { operatorName: 'Sky Harmony Fleet', operatorId: operators[4]!.id, status: 'pending', daysFromNow: 60, drones: 50, location: 'Barstow, CA' },
    { operatorName: 'Sky Harmony Fleet', operatorId: operators[4]!.id, status: 'completed', daysFromNow: -30, drones: 65, location: 'Flagstaff, AZ' },
  ];

  const now = new Date();
  sampleBookings.forEach((sb) => {
    const showDate = new Date(now);
    showDate.setDate(showDate.getDate() + sb.daysFromNow);
    const endDate = new Date(showDate);
    endDate.setHours(endDate.getHours() + 4);

    const booking: Booking = {
      id: crypto.randomUUID(),
      operator_id: sb.operatorId,
      operator_name: sb.operatorName,
      show_date: showDate.toISOString(),
      end_date: endDate.toISOString(),
      drone_count: sb.drones,
      location: sb.location,
      status: sb.status,
      notes: undefined,
      allocated_assets: [],
      created_at: '2024-01-15T00:00:00.000Z',
      updated_at: new Date().toISOString(),
    };
    store.bookings.set(booking.id, booking);
  });
}
