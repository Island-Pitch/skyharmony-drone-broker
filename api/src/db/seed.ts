import { db, pool } from './connection.js';
import { users, assetTypes, assets, bookings } from './schema.js';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';

/* ---------- deterministic PRNG (matches frontend) ---------- */
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

/* ---------- constants ---------- */
const MANUFACTURERS = [
  { name: 'Verge Aero', models: ['X1', 'X1-Pro', 'X7'] },
  { name: 'DJI Enterprise', models: ['M30', 'M30T', 'Matrice 350'] },
  { name: 'Skydio', models: ['X10', 'X10D', 'S2+'] },
  { name: 'Autel Robotics', models: ['EVO Max', 'EVO II Pro', 'Dragonfish'] },
];

const STATUS_DISTRIBUTION = [
  { status: 'available' as const, weight: 60 },
  { status: 'allocated' as const, weight: 15 },
  { status: 'in_transit' as const, weight: 10 },
  { status: 'maintenance' as const, weight: 10 },
  { status: 'retired' as const, weight: 5 },
];

const operators = [
  { id: 'a0000000-0000-4000-8000-000000000010', name: 'NightBrite Drones', drone_count: 120, region: 'Southern California' },
  { id: 'a0000000-0000-4000-8000-000000000020', name: 'Orion Skies', drone_count: 110, region: 'Northern California' },
  { id: 'a0000000-0000-4000-8000-000000000030', name: 'Vegas Drone Works', drone_count: 100, region: 'Nevada' },
  { id: 'a0000000-0000-4000-8000-000000000040', name: 'Patriotic Air', drone_count: 90, region: 'Arizona' },
  { id: 'a0000000-0000-4000-8000-000000000050', name: 'Sky Harmony Fleet', drone_count: 80, region: 'Southwest US' },
];

/* ---------- main ---------- */
async function seed() {
  console.log('Seeding database...');
  const rand = seededRandom(42);

  // 1. Create admin user
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const adminId = '00000000-0000-4000-8000-admin0000001';

  await db.insert(users).values({
    id: adminId,
    email: 'admin@skyharmony.dev',
    password_hash: adminPasswordHash,
    name: 'System Admin',
    role: 'CentralRepoAdmin',
  }).onConflictDoNothing();

  // 2. Create operator users (so foreign keys work)
  for (const op of operators) {
    const hash = await bcrypt.hash('operator123', 10);
    await db.insert(users).values({
      id: op.id,
      email: `${op.name.toLowerCase().replace(/\s+/g, '.')}@skyharmony.dev`,
      password_hash: hash,
      name: op.name,
      role: 'OperatorAdmin',
    }).onConflictDoNothing();
  }

  // 3. Asset types
  const typeRows = [
    { id: '00000000-0000-4000-8000-000000000001', name: 'drone', description: 'Unmanned aerial vehicle' },
    { id: '00000000-0000-4000-8000-000000000002', name: 'battery', description: 'Rechargeable battery pack' },
    { id: '00000000-0000-4000-8000-000000000003', name: 'charger', description: 'Battery charging station' },
    { id: '00000000-0000-4000-8000-000000000004', name: 'base_station', description: 'Ground control base station' },
  ];
  for (const t of typeRows) {
    await db.insert(assetTypes).values(t).onConflictDoNothing();
  }

  // 4. Generate 500 drones + batteries
  let droneIndex = 0;
  const droneRows: (typeof assets.$inferInsert)[] = [];
  const batteryRows: (typeof assets.$inferInsert)[] = [];

  for (const op of operators) {
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

      const droneId = crypto.randomUUID();
      droneRows.push({
        id: droneId,
        asset_type_id: typeRows[0]!.id,
        serial_number: `${mfr.name.substring(0, 2).toUpperCase()}-${String(i).padStart(4, '0')}`,
        manufacturer: mfr.name,
        model,
        status: statusEntry.status,
        firmware_version: `${Math.floor(rand() * 5 + 1)}.${Math.floor(rand() * 10)}.${Math.floor(rand() * 20)}`,
        flight_hours: String(flightHours),
        battery_cycles: batteryCycles,
        typed_attributes: {
          max_altitude_ft: Math.floor(rand() * 400 + 100),
          payload_capacity_kg: Math.round(rand() * 10 * 10) / 10,
        },
        current_operator_id: op.id,
        parent_asset_id: null,
      });

      // 1-3 batteries per drone
      const numBatteries = Math.floor(rand() * 3) + 1;
      for (let b = 0; b < numBatteries; b++) {
        batteryRows.push({
          id: crypto.randomUUID(),
          asset_type_id: typeRows[1]!.id,
          serial_number: `BAT-${String(i).padStart(4, '0')}-${b + 1}`,
          manufacturer: mfr.name,
          model: 'LiPo 5200mAh',
          status: statusEntry.status === 'retired' ? 'retired' : 'available',
          battery_cycles: Math.floor(rand() * 300),
          typed_attributes: { capacity_mah: 5200 },
          current_operator_id: null,
          parent_asset_id: droneId,
        });
      }
    }
  }

  // Insert in batches
  const BATCH = 100;
  for (let i = 0; i < droneRows.length; i += BATCH) {
    await db.insert(assets).values(droneRows.slice(i, i + BATCH)).onConflictDoNothing();
  }
  console.log(`  Inserted ${droneRows.length} drones`);

  for (let i = 0; i < batteryRows.length; i += BATCH) {
    await db.insert(assets).values(batteryRows.slice(i, i + BATCH)).onConflictDoNothing();
  }
  console.log(`  Inserted ${batteryRows.length} batteries`);

  // 5. Base stations
  const bsRows: (typeof assets.$inferInsert)[] = [];
  for (let i = 1; i <= 20; i++) {
    bsRows.push({
      id: crypto.randomUUID(),
      asset_type_id: typeRows[3]!.id,
      serial_number: `BS-${String(i).padStart(3, '0')}`,
      manufacturer: 'DJI Enterprise',
      model: 'RC Plus',
      status: 'available',
      typed_attributes: { range_km: 15 },
      current_operator_id: null,
      parent_asset_id: null,
    });
  }
  await db.insert(assets).values(bsRows).onConflictDoNothing();
  console.log('  Inserted 20 base stations');

  // 6. Chargers
  const chargerRows: (typeof assets.$inferInsert)[] = [];
  for (let i = 1; i <= 10; i++) {
    chargerRows.push({
      id: crypto.randomUUID(),
      asset_type_id: typeRows[2]!.id,
      serial_number: `CHG-${String(i).padStart(3, '0')}`,
      manufacturer: 'Verge Aero',
      model: 'Fast Charger 8-Bay',
      status: 'available',
      typed_attributes: { bays: 8 },
      current_operator_id: null,
      parent_asset_id: null,
    });
  }
  await db.insert(assets).values(chargerRows).onConflictDoNothing();
  console.log('  Inserted 10 chargers');

  // 7. Bookings
  const sampleBookings = [
    { operatorName: 'NightBrite Drones', operatorId: operators[0]!.id, status: 'confirmed', daysFromNow: 5, drones: 100, location: 'Los Angeles, CA' },
    { operatorName: 'NightBrite Drones', operatorId: operators[0]!.id, status: 'pending', daysFromNow: 18, drones: 60, location: 'San Diego, CA' },
    { operatorName: 'NightBrite Drones', operatorId: operators[0]!.id, status: 'allocated', daysFromNow: 10, drones: 80, location: 'Anaheim, CA' },
    { operatorName: 'NightBrite Drones', operatorId: operators[0]!.id, status: 'completed', daysFromNow: -7, drones: 50, location: 'Long Beach, CA' },
    { operatorName: 'NightBrite Drones', operatorId: operators[0]!.id, status: 'pending', daysFromNow: 25, drones: 40, location: 'Palm Springs, CA' },
    { operatorName: 'Orion Skies', operatorId: operators[1]!.id, status: 'pending', daysFromNow: 14, drones: 90, location: 'San Francisco, CA' },
    { operatorName: 'Orion Skies', operatorId: operators[1]!.id, status: 'confirmed', daysFromNow: 7, drones: 70, location: 'Sacramento, CA' },
    { operatorName: 'Orion Skies', operatorId: operators[1]!.id, status: 'allocated', daysFromNow: 21, drones: 110, location: 'San Jose, CA' },
    { operatorName: 'Orion Skies', operatorId: operators[1]!.id, status: 'completed', daysFromNow: -14, drones: 45, location: 'Oakland, CA' },
    { operatorName: 'Vegas Drone Works', operatorId: operators[2]!.id, status: 'confirmed', daysFromNow: 3, drones: 200, location: 'Las Vegas, NV' },
    { operatorName: 'Vegas Drone Works', operatorId: operators[2]!.id, status: 'pending', daysFromNow: 30, drones: 150, location: 'Reno, NV' },
    { operatorName: 'Vegas Drone Works', operatorId: operators[2]!.id, status: 'allocated', daysFromNow: 12, drones: 80, location: 'Henderson, NV' },
    { operatorName: 'Vegas Drone Works', operatorId: operators[2]!.id, status: 'cancelled', daysFromNow: -3, drones: 30, location: 'Las Vegas Strip, NV' },
    { operatorName: 'Vegas Drone Works', operatorId: operators[2]!.id, status: 'pending', daysFromNow: 45, drones: 120, location: 'Laughlin, NV' },
    { operatorName: 'Patriotic Air', operatorId: operators[3]!.id, status: 'pending', daysFromNow: 20, drones: 100, location: 'Phoenix, AZ' },
    { operatorName: 'Patriotic Air', operatorId: operators[3]!.id, status: 'confirmed', daysFromNow: 8, drones: 75, location: 'Scottsdale, AZ' },
    { operatorName: 'Patriotic Air', operatorId: operators[3]!.id, status: 'allocated', daysFromNow: 15, drones: 60, location: 'Tucson, AZ' },
    { operatorName: 'Patriotic Air', operatorId: operators[3]!.id, status: 'completed', daysFromNow: -21, drones: 40, location: 'Sedona, AZ' },
    { operatorName: 'Patriotic Air', operatorId: operators[3]!.id, status: 'cancelled', daysFromNow: -10, drones: 25, location: 'Tempe, AZ' },
    { operatorName: 'Sky Harmony Fleet', operatorId: operators[4]!.id, status: 'pending', daysFromNow: 35, drones: 300, location: 'Coachella Valley, CA' },
    { operatorName: 'Sky Harmony Fleet', operatorId: operators[4]!.id, status: 'confirmed', daysFromNow: 4, drones: 120, location: 'Lake Havasu, AZ' },
    { operatorName: 'Sky Harmony Fleet', operatorId: operators[4]!.id, status: 'allocated', daysFromNow: 9, drones: 80, location: 'Boulder City, NV' },
    { operatorName: 'Sky Harmony Fleet', operatorId: operators[4]!.id, status: 'pending', daysFromNow: 60, drones: 50, location: 'Barstow, CA' },
    { operatorName: 'Sky Harmony Fleet', operatorId: operators[4]!.id, status: 'completed', daysFromNow: -30, drones: 65, location: 'Flagstaff, AZ' },
  ];

  const now = new Date();
  const bookingRows: (typeof bookings.$inferInsert)[] = [];

  for (const sb of sampleBookings) {
    const showDate = new Date(now);
    showDate.setDate(showDate.getDate() + sb.daysFromNow);
    const endDate = new Date(showDate);
    endDate.setHours(endDate.getHours() + 4);

    bookingRows.push({
      id: crypto.randomUUID(),
      operator_id: sb.operatorId,
      operator_name: sb.operatorName,
      show_date: showDate,
      end_date: endDate,
      drone_count: sb.drones,
      location: sb.location,
      status: sb.status,
      notes: null,
      allocated_assets: [],
    });
  }

  await db.insert(bookings).values(bookingRows).onConflictDoNothing();
  console.log(`  Inserted ${bookingRows.length} bookings`);

  console.log('Seed complete!');
  await pool.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
