import { db, pool } from './connection.js';
import { users, assetTypes, assets, bookings, invoices, manifests, transportLegs, maintenanceRules, maintenanceTickets, settlements, sponsors } from './schema.js';
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
  const adminId = '00000000-0000-4000-8000-ad0100000001';

  await db.insert(users).values({
    id: adminId,
    email: 'admin@skyharmony.dev',
    password_hash: adminPasswordHash,
    name: 'System Admin',
    role: 'CentralRepoAdmin',
    organization: 'Sky Harmony',
    region: 'Southern California',
    onboarded: 'true',
  }).onConflictDoNothing();

  const logisticsPasswordHash = await bcrypt.hash('logistics123', 10);
  await db.insert(users).values({
    id: '00000000-0000-4000-8000-ad0100000002',
    email: 'logistics@skyharmony.dev',
    password_hash: logisticsPasswordHash,
    name: 'Logistics Demo',
    role: 'LogisticsStaff',
    onboarded: 'true',
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
      organization: op.name,
      region: op.region,
      fleet_size: op.drone_count,
      onboarded: 'true',
    }).onConflictDoNothing();
  }

  // 3. Asset types
  const typeRows = [
    { id: '00000000-0000-4000-8000-000000000001', name: 'drone', description: 'Unmanned aerial vehicle' },
    { id: '00000000-0000-4000-8000-000000000002', name: 'battery', description: 'Rechargeable battery pack' },
    { id: '00000000-0000-4000-8000-000000000003', name: 'charger', description: 'Battery charging station' },
    { id: '00000000-0000-4000-8000-000000000004', name: 'base_station', description: 'Ground control base station' },
    { id: '00000000-0000-4000-8000-000000000005', name: 'trailer', description: 'Transport trailer for drone logistics' },
    { id: '00000000-0000-4000-8000-000000000006', name: 'antenna_array', description: 'Multi-channel antenna array for extended range' },
    { id: '00000000-0000-4000-8000-000000000007', name: 'ground_control', description: 'Ground control station with multi-drone management' },
    { id: '00000000-0000-4000-8000-000000000008', name: 'rtk_station', description: 'Real-time kinematic positioning station' },
    { id: '00000000-0000-4000-8000-000000000009', name: 'fixed_wing', description: 'Fixed-wing aircraft for aerial coordination' },
    { id: '00000000-0000-4000-8000-00000000000a', name: 'helicopter', description: 'Rotary-wing aircraft for aerial operations' },
    { id: '00000000-0000-4000-8000-00000000000b', name: 'pyrodrone', description: 'Pyrotechnic-equipped drone for aerial fireworks' },
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

  // 6b. Trailers
  const trailerRows: (typeof assets.$inferInsert)[] = [];
  const vehicleTypes = ['enclosed', 'flatbed', 'refrigerated'];
  const states = ['CA', 'NV', 'AZ'];
  for (let i = 1; i <= 15; i++) {
    const state = states[i % states.length]!;
    trailerRows.push({
      id: crypto.randomUUID(),
      asset_type_id: typeRows[4]!.id,
      serial_number: `TRL-${String(i).padStart(3, '0')}`,
      manufacturer: 'TrailKing',
      model: 'DroneHauler Pro',
      status: 'available',
      typed_attributes: {
        capacity_drones: 100,
        vehicle_type: vehicleTypes[(i - 1) % vehicleTypes.length],
        license_plate: `${state}-${String(1000 + i)}`,
      },
      current_operator_id: null,
      parent_asset_id: null,
    });
  }
  await db.insert(assets).values(trailerRows).onConflictDoNothing();
  console.log('  Inserted 15 trailers');

  // 6c. Antenna arrays
  const antennaRows: (typeof assets.$inferInsert)[] = [];
  const frequencies = [2.4, 5.8, 900];
  for (let i = 1; i <= 10; i++) {
    antennaRows.push({
      id: crypto.randomUUID(),
      asset_type_id: typeRows[5]!.id,
      serial_number: `ANT-${String(i).padStart(3, '0')}`,
      manufacturer: 'Ubiquiti',
      model: 'AirMax Sector',
      status: 'available',
      typed_attributes: {
        frequency_ghz: frequencies[(i - 1) % frequencies.length],
        range_km: 5 + Math.floor(rand() * 10),
        channels: 16,
      },
      current_operator_id: null,
      parent_asset_id: null,
    });
  }
  await db.insert(assets).values(antennaRows).onConflictDoNothing();
  console.log('  Inserted 10 antenna arrays');

  // 6d. Ground control stations
  const gcRows: (typeof assets.$inferInsert)[] = [];
  const swVersions = ['4.2.1', '4.3.0', '5.0.0-beta', '4.1.7'];
  for (let i = 1; i <= 8; i++) {
    gcRows.push({
      id: crypto.randomUUID(),
      asset_type_id: typeRows[6]!.id,
      serial_number: `GCS-${String(i).padStart(3, '0')}`,
      manufacturer: 'Verge Aero',
      model: 'Command Center',
      status: 'available',
      typed_attributes: {
        software_version: swVersions[(i - 1) % swVersions.length],
        max_drones: 500,
        display_count: 4,
      },
      current_operator_id: null,
      parent_asset_id: null,
    });
  }
  await db.insert(assets).values(gcRows).onConflictDoNothing();
  console.log('  Inserted 8 ground control stations');

  // 6e. RTK stations
  const rtkRows: (typeof assets.$inferInsert)[] = [];
  const constellations = ['GPS+GLONASS', 'GPS+GLONASS+Galileo', 'GPS+BeiDou'];
  for (let i = 1; i <= 5; i++) {
    rtkRows.push({
      id: crypto.randomUUID(),
      asset_type_id: typeRows[7]!.id,
      serial_number: `RTK-${String(i).padStart(3, '0')}`,
      manufacturer: 'Trimble',
      model: 'R12i',
      status: 'available',
      typed_attributes: {
        accuracy_cm: 2,
        constellation: constellations[(i - 1) % constellations.length],
        range_km: 10,
      },
      current_operator_id: null,
      parent_asset_id: null,
    });
  }
  await db.insert(assets).values(rtkRows).onConflictDoNothing();
  console.log('  Inserted 5 RTK stations');

  // 6f. Fixed-wing aircraft (5)
  const fwModels = ['Cessna 172', 'Piper Cherokee', 'Beechcraft Bonanza', 'Cirrus SR22', 'Diamond DA40'];
  const fwRows: (typeof assets.$inferInsert)[] = [];
  for (let i = 1; i <= 5; i++) {
    fwRows.push({
      id: crypto.randomUUID(), asset_type_id: typeRows[8]!.id,
      serial_number: `FW-${String(i).padStart(3, '0')}`,
      manufacturer: fwModels[i - 1]!.split(' ')[0]!, model: fwModels[i - 1]!,
      status: 'available',
      typed_attributes: { tail_number: `N${1000 + i}SH`, airframe_hours: 500 + Math.floor(rand() * 3000), engine_hours: 300 + Math.floor(rand() * 2000), ifr_certified: i <= 3, seats: i <= 2 ? 4 : 6, range_nm: 400 + Math.floor(rand() * 600) },
      current_operator_id: null, parent_asset_id: null,
    });
  }
  await db.insert(assets).values(fwRows).onConflictDoNothing();
  console.log('  Inserted 5 fixed-wing aircraft');

  // 6g. Helicopters (3)
  const heliNames = ['Bell 206', 'Robinson R44', 'Airbus H125'];
  const hlRows: (typeof assets.$inferInsert)[] = [];
  for (let i = 1; i <= 3; i++) {
    hlRows.push({
      id: crypto.randomUUID(), asset_type_id: typeRows[9]!.id,
      serial_number: `HELI-${String(i).padStart(3, '0')}`,
      manufacturer: heliNames[i - 1]!.split(' ')[0]!, model: heliNames[i - 1]!,
      status: 'available',
      typed_attributes: { tail_number: `N${2000 + i}SH`, rotor_hours: 200 + Math.floor(rand() * 1500), turbine_hours: 150 + Math.floor(rand() * 1200), max_payload_kg: 300 + Math.floor(rand() * 500) },
      current_operator_id: null, parent_asset_id: null,
    });
  }
  await db.insert(assets).values(hlRows).onConflictDoNothing();
  console.log('  Inserted 3 helicopters');

  // 6h. Pyrodrones (20)
  const pdRows: (typeof assets.$inferInsert)[] = [];
  for (let i = 1; i <= 20; i++) {
    pdRows.push({
      id: crypto.randomUUID(), asset_type_id: typeRows[10]!.id,
      serial_number: `PYRO-${String(i).padStart(3, '0')}`,
      manufacturer: 'Verge Aero', model: 'PyroLauncher X1',
      status: i <= 16 ? 'available' : 'maintenance',
      typed_attributes: { pyro_capacity: 4 + Math.floor(rand() * 8), faa_waiver_number: `FAA-PY-${String(3000 + i)}`, max_altitude_ft: 200 + Math.floor(rand() * 300) },
      current_operator_id: null, parent_asset_id: null,
    });
  }
  await db.insert(assets).values(pdRows).onConflictDoNothing();
  console.log('  Inserted 20 pyrodrones');

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

  // 8. Manifests + transport legs
  const manifestData = [
    {
      id: crypto.randomUUID(),
      booking_id: bookingRows[0]!.id!,
      status: 'in_transit',
      created_by: adminId,
      assets: droneRows.slice(0, 5).map((d) => d.id!),
      pickup_location: 'SkyHarmony Warehouse, Los Angeles, CA',
      delivery_location: bookingRows[0]!.location,
      pickup_date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      delivery_date: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      notes: 'Priority shipment for confirmed show',
    },
    {
      id: crypto.randomUUID(),
      booking_id: bookingRows[2]!.id!,
      status: 'draft',
      created_by: adminId,
      assets: droneRows.slice(5, 10).map((d) => d.id!),
      pickup_location: 'SkyHarmony Warehouse, Los Angeles, CA',
      delivery_location: bookingRows[2]!.location,
      pickup_date: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
      delivery_date: new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000),
      notes: 'Staging for Anaheim event',
    },
    {
      id: crypto.randomUUID(),
      booking_id: bookingRows[9]!.id!,
      status: 'delivered',
      created_by: adminId,
      assets: droneRows.slice(10, 15).map((d) => d.id!),
      pickup_location: 'SkyHarmony Warehouse, Henderson, NV',
      delivery_location: bookingRows[9]!.location,
      pickup_date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      delivery_date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      notes: 'Las Vegas show delivery complete',
    },
  ];

  await db.insert(manifests).values(manifestData).onConflictDoNothing();
  console.log(`  Inserted ${manifestData.length} manifests`);

  const legData = [
    {
      manifest_id: manifestData[0]!.id,
      leg_number: 1,
      origin: 'SkyHarmony Warehouse, LA',
      destination: 'Staging Area, Los Angeles',
      status: 'complete',
      driver_name: 'Mike Rodriguez',
      vehicle_info: 'Ford Transit #SH-101',
      departed_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      arrived_at: new Date(now.getTime() - 1.5 * 24 * 60 * 60 * 1000),
    },
    {
      manifest_id: manifestData[0]!.id,
      leg_number: 2,
      origin: 'Staging Area, Los Angeles',
      destination: bookingRows[0]!.location,
      status: 'in_transit',
      driver_name: 'Sarah Chen',
      vehicle_info: 'Sprinter Van #SH-205',
      departed_at: new Date(now.getTime() - 0.5 * 24 * 60 * 60 * 1000),
      arrived_at: null,
    },
    {
      manifest_id: manifestData[2]!.id,
      leg_number: 1,
      origin: 'SkyHarmony Warehouse, Henderson, NV',
      destination: 'Las Vegas, NV',
      status: 'complete',
      driver_name: 'James Park',
      vehicle_info: 'Box Truck #SH-310',
      departed_at: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
      arrived_at: new Date(now.getTime() - 3.5 * 24 * 60 * 60 * 1000),
    },
  ];

  await db.insert(transportLegs).values(legData).onConflictDoNothing();
  console.log(`  Inserted ${legData.length} transport legs`);

  // 9. Maintenance rules (default thresholds)
  const ruleRows = [
    {
      id: '00000000-0000-4000-8000-a00e00000001',
      asset_type_id: null,
      rule_name: 'Flight hours mandatory ground (>= 2000)',
      field: 'flight_hours',
      operator: 'gte',
      threshold_value: '2000',
      severity: 'mandatory_ground',
      enabled: true,
    },
    {
      id: '00000000-0000-4000-8000-a00e00000002',
      asset_type_id: null,
      rule_name: 'Flight hours warning (>= 1800)',
      field: 'flight_hours',
      operator: 'gte',
      threshold_value: '1800',
      severity: 'warning',
      enabled: true,
    },
    {
      id: '00000000-0000-4000-8000-a00e00000003',
      asset_type_id: null,
      rule_name: 'Battery cycles mandatory ground (>= 500)',
      field: 'battery_cycles',
      operator: 'gte',
      threshold_value: '500',
      severity: 'mandatory_ground',
      enabled: true,
    },
    {
      id: '00000000-0000-4000-8000-a00e00000004',
      asset_type_id: null,
      rule_name: 'Battery cycles warning (>= 450)',
      field: 'battery_cycles',
      operator: 'gte',
      threshold_value: '450',
      severity: 'warning',
      enabled: true,
    },
  ];

  for (const r of ruleRows) {
    await db.insert(maintenanceRules).values(r).onConflictDoNothing();
  }
  console.log('  Inserted 4 maintenance rules');

  // 9. Sample maintenance tickets
  const highHoursDrones = droneRows.filter((d) => Number(d.flight_hours ?? 0) >= 1800).slice(0, 3);
  const highCycleDrones = droneRows.filter((d) => (d.battery_cycles ?? 0) >= 450).slice(0, 2);

  const sampleTickets: (typeof maintenanceTickets.$inferInsert)[] = [];

  if (highHoursDrones[0]) {
    sampleTickets.push({
      id: '00000000-0000-4000-8000-b00000000001',
      asset_id: highHoursDrones[0].id!,
      rule_id: ruleRows[1]!.id,
      ticket_type: 'threshold',
      status: 'open',
      severity: 'warning',
      description: `Flight hours at ${highHoursDrones[0].flight_hours} — approaching 2000 limit`,
    });
  }
  if (highHoursDrones[1]) {
    sampleTickets.push({
      id: '00000000-0000-4000-8000-b00000000002',
      asset_id: highHoursDrones[1].id!,
      rule_id: ruleRows[0]!.id,
      ticket_type: 'threshold',
      status: 'assigned',
      severity: 'mandatory_ground',
      description: `Flight hours at ${highHoursDrones[1].flight_hours} — exceeds 2000 limit`,
      assigned_to: adminId,
    });
  }
  if (highHoursDrones[2]) {
    sampleTickets.push({
      id: '00000000-0000-4000-8000-b00000000003',
      asset_id: highHoursDrones[2].id!,
      rule_id: ruleRows[1]!.id,
      ticket_type: 'threshold',
      status: 'in_progress',
      severity: 'warning',
      description: `Flight hours at ${highHoursDrones[2].flight_hours} — approaching 2000 limit`,
      assigned_to: adminId,
      parts_needed: 'Motor bearing replacement kit',
    });
  }
  if (highCycleDrones[0]) {
    sampleTickets.push({
      id: '00000000-0000-4000-8000-b00000000004',
      asset_id: highCycleDrones[0].id!,
      rule_id: ruleRows[3]!.id,
      ticket_type: 'threshold',
      status: 'verification',
      severity: 'warning',
      description: `Battery cycles at ${highCycleDrones[0].battery_cycles} — approaching 500 limit`,
      assigned_to: adminId,
      resolution_notes: 'Battery inspected and recalibrated',
    });
  }
  if (highCycleDrones[1]) {
    sampleTickets.push({
      id: '00000000-0000-4000-8000-b00000000005',
      asset_id: highCycleDrones[1].id!,
      rule_id: ruleRows[2]!.id,
      ticket_type: 'threshold',
      status: 'complete',
      severity: 'mandatory_ground',
      description: `Battery cycles at ${highCycleDrones[1].battery_cycles} — exceeds 500 limit`,
      assigned_to: adminId,
      resolution_notes: 'Battery replaced with new unit',
      completed_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    });
  }

  for (const t of sampleTickets) {
    await db.insert(maintenanceTickets).values(t).onConflictDoNothing();
  }
  console.log(`  Inserted ${sampleTickets.length} maintenance tickets`);
  // 8. Invoices — 10 sample invoices from the first 10 bookings
  const ALLOCATION_FEE = 350;
  const INSURANCE_RATE = 0.07;
  const TAX_RATE = 0.085;
  const invoiceStatuses = ['draft', 'sent', 'paid', 'overdue', 'paid', 'sent', 'draft', 'paid', 'overdue', 'sent'] as const;
  const paymentMethods = ['pending', 'pending', 'credit_card', 'pending', 'ach', 'pending', 'pending', 'credit_card', 'pending', 'pending'] as const;

  const invoiceRows: (typeof invoices.$inferInsert)[] = [];
  for (let i = 0; i < 10 && i < bookingRows.length; i++) {
    const bk = bookingRows[i]!;
    const allocationTotal = bk.drone_count * ALLOCATION_FEE;
    const insuranceTotal = Math.round(allocationTotal * INSURANCE_RATE * 100) / 100;
    const lineItems = [
      { description: 'Drone allocation fee', quantity: bk.drone_count, unit_price: ALLOCATION_FEE, total: allocationTotal },
      { description: 'Drone insurance coverage', quantity: 1, unit_price: insuranceTotal, total: insuranceTotal },
    ];
    const subtotal = allocationTotal + insuranceTotal;
    const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
    const total = Math.round((subtotal + tax) * 100) / 100;
    const dueDate = new Date(now);
    dueDate.setDate(dueDate.getDate() + 30 + i * 3);
    const status = invoiceStatuses[i]!;
    const paidDate = status === 'paid' ? new Date(now.getTime() - (i + 1) * 86400000) : null;

    invoiceRows.push({
      id: crypto.randomUUID(),
      booking_id: bk.id!,
      operator_id: bk.operator_id!,
      operator_name: bk.operator_name!,
      status,
      line_items: lineItems,
      subtotal: String(subtotal),
      tax: String(tax),
      total: String(total),
      due_date: dueDate,
      paid_date: paidDate,
      payment_method: paymentMethods[i]!,
    });
  }
  await db.insert(invoices).values(invoiceRows).onConflictDoNothing();
  console.log(`  Inserted ${invoiceRows.length} invoices`);

  // 10. Settlements — 3 sample settlements for different operators/periods
  const settlementRows: (typeof settlements.$inferInsert)[] = [
    {
      id: '00000000-0000-4000-8000-c00000000001',
      operator_id: operators[0]!.id,
      period_start: '2026-03-01',
      period_end: '2026-03-31',
      status: 'paid',
      total_due: '40568.50',
      total_payable: '40568.50',
      net_amount: '37728.71',
      deductions: {
        insurance_pool: 2839.80,
        damage_charges: 0,
        total_deductions: 2839.80,
      },
      payment_reference: 'ACH-2026-0401-NB',
      approved_by: adminId,
      approved_at: new Date(now.getTime() - 10 * 86400000),
      paid_at: new Date(now.getTime() - 5 * 86400000),
    },
    {
      id: '00000000-0000-4000-8000-c00000000002',
      operator_id: operators[1]!.id,
      period_start: '2026-03-01',
      period_end: '2026-03-31',
      status: 'approved',
      total_due: '35125.00',
      total_payable: '35125.00',
      net_amount: '31166.25',
      deductions: {
        insurance_pool: 2458.75,
        damage_charges: 1500,
        total_deductions: 3958.75,
      },
      approved_by: adminId,
      approved_at: new Date(now.getTime() - 3 * 86400000),
    },
    {
      id: '00000000-0000-4000-8000-c00000000003',
      operator_id: operators[2]!.id,
      period_start: '2026-04-01',
      period_end: '2026-04-15',
      status: 'draft',
      total_due: '28750.00',
      total_payable: '28750.00',
      net_amount: '26737.50',
      deductions: {
        insurance_pool: 2012.50,
        damage_charges: 0,
        total_deductions: 2012.50,
      },
    },
  ];

  await db.insert(settlements).values(settlementRows).onConflictDoNothing();
  console.log(`  Inserted ${settlementRows.length} settlements`);

  // 11. Sponsors
  const sponsorRows = [
    { id: '00000000-0000-4000-8000-e00000000001', name: 'Farmers & Merchants Bank', logo_url: null, campaign_tag: 'community-banking', contact_email: 'partnerships@fmb.com' },
    { id: '00000000-0000-4000-8000-e00000000002', name: 'City of Seal Beach', logo_url: null, campaign_tag: 'civic-pride', contact_email: 'events@sealbeachca.gov' },
    { id: '00000000-0000-4000-8000-e00000000003', name: 'Verge Aero', logo_url: null, campaign_tag: 'drone-innovation', contact_email: 'marketing@vergeaero.com' },
  ];
  for (const s of sponsorRows) {
    await db.insert(sponsors).values(s).onConflictDoNothing();
  }
  console.log(`  Inserted ${sponsorRows.length} sponsors`);

  console.log('Seed complete!');
  await pool.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
