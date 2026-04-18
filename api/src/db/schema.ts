import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  numeric,
  jsonb,
  boolean,
  date,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

/* ------------------------------------------------------------------ */
/*  users                                                              */
/* ------------------------------------------------------------------ */
export const users = pgTable('users', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  email: varchar('email', { length: 255 }).unique().notNull(),
  password_hash: varchar('password_hash', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull().default('OperatorStaff'),
  organization: varchar('organization', { length: 255 }),
  region: varchar('region', { length: 255 }),
  fleet_size: integer('fleet_size'),
  onboarded: varchar('onboarded', { length: 10 }).default('false'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

/* ------------------------------------------------------------------ */
/*  asset_types                                                        */
/* ------------------------------------------------------------------ */
export const assetTypes = pgTable('asset_types', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  name: varchar('name', { length: 100 }).unique().notNull(),
  description: text('description'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

/* ------------------------------------------------------------------ */
/*  assets                                                             */
/* ------------------------------------------------------------------ */
export const assets = pgTable('assets', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  asset_type_id: uuid('asset_type_id').references(() => assetTypes.id),
  serial_number: varchar('serial_number', { length: 100 }).unique().notNull(),
  manufacturer: varchar('manufacturer', { length: 255 }).notNull(),
  model: varchar('model', { length: 255 }).notNull(),
  status: varchar('status', { length: 50 }).notNull().default('available'),
  firmware_version: varchar('firmware_version', { length: 50 }),
  flight_hours: numeric('flight_hours', { precision: 10, scale: 1 }).default('0'),
  battery_cycles: integer('battery_cycles').default(0),
  typed_attributes: jsonb('typed_attributes').default({}),
  current_operator_id: uuid('current_operator_id').references(() => users.id),
  parent_asset_id: uuid('parent_asset_id'), // self-referential, added below as soft ref
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

/* ------------------------------------------------------------------ */
/*  bookings                                                           */
/* ------------------------------------------------------------------ */
export const bookings = pgTable('bookings', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  operator_id: uuid('operator_id').references(() => users.id),
  operator_name: varchar('operator_name', { length: 255 }),
  show_date: timestamp('show_date').notNull(),
  end_date: timestamp('end_date'),
  drone_count: integer('drone_count').notNull(),
  location: varchar('location', { length: 255 }).notNull(),
  status: varchar('status', { length: 50 }).default('pending'),
  notes: text('notes'),
  allocated_assets: jsonb('allocated_assets').default([]),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

/* ------------------------------------------------------------------ */
/*  audit_events                                                       */
/* ------------------------------------------------------------------ */
export const auditEvents = pgTable('audit_events', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  asset_id: uuid('asset_id').references(() => assets.id),
  field_changed: varchar('field_changed', { length: 100 }),
  old_value: text('old_value'),
  new_value: text('new_value').notNull(),
  changed_by: uuid('changed_by').references(() => users.id),
  changed_at: timestamp('changed_at').defaultNow(),
});

/* ------------------------------------------------------------------ */
/*  custody_events                                                     */
/* ------------------------------------------------------------------ */
export const custodyEvents = pgTable('custody_events', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  asset_id: uuid('asset_id').references(() => assets.id),
  action: varchar('action', { length: 20 }).notNull(),
  actor_id: uuid('actor_id').references(() => users.id),
  booking_id: uuid('booking_id').references(() => bookings.id),
  mac_address: varchar('mac_address', { length: 50 }),
  timestamp: timestamp('timestamp').defaultNow(),
  notes: text('notes'),
});

/* ------------------------------------------------------------------ */
/*  manifests                                                          */
/* ------------------------------------------------------------------ */
export const manifests = pgTable('manifests', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  booking_id: uuid('booking_id').references(() => bookings.id),
  status: varchar('status', { length: 50 }).notNull().default('draft'),
  created_by: uuid('created_by').references(() => users.id),
  assets: jsonb('assets').default([]),
  pickup_location: varchar('pickup_location', { length: 255 }),
  delivery_location: varchar('delivery_location', { length: 255 }),
  pickup_date: timestamp('pickup_date'),
  delivery_date: timestamp('delivery_date'),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

/* ------------------------------------------------------------------ */
/*  transport_legs                                                     */
/* ------------------------------------------------------------------ */
export const transportLegs = pgTable('transport_legs', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  manifest_id: uuid('manifest_id').references(() => manifests.id),
  leg_number: integer('leg_number').notNull(),
  origin: varchar('origin', { length: 255 }),
  destination: varchar('destination', { length: 255 }),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  driver_name: varchar('driver_name', { length: 255 }),
  vehicle_info: varchar('vehicle_info', { length: 255 }),
  departed_at: timestamp('departed_at'),
  arrived_at: timestamp('arrived_at'),
  created_at: timestamp('created_at').defaultNow(),
});

/* ------------------------------------------------------------------ */
/*  incidents                                                          */
/* ------------------------------------------------------------------ */
/* ------------------------------------------------------------------ */
/*  invoices                                                           */
/* ------------------------------------------------------------------ */
export const invoices = pgTable('invoices', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  booking_id: uuid('booking_id').references(() => bookings.id),
  operator_id: uuid('operator_id').references(() => users.id),
  operator_name: varchar('operator_name', { length: 255 }),
  status: varchar('status', { length: 20 }).notNull().default('draft'),
  line_items: jsonb('line_items').notNull().default([]),
  subtotal: numeric('subtotal', { precision: 12, scale: 2 }).notNull().default('0'),
  tax: numeric('tax', { precision: 12, scale: 2 }).notNull().default('0'),
  total: numeric('total', { precision: 12, scale: 2 }).notNull().default('0'),
  due_date: timestamp('due_date'),
  paid_date: timestamp('paid_date'),
  payment_method: varchar('payment_method', { length: 20 }).default('pending'),
  stripe_payment_id: varchar('stripe_payment_id', { length: 255 }),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

/* ------------------------------------------------------------------ */
/*  incidents                                                          */
/* ------------------------------------------------------------------ */
export const incidents = pgTable('incidents', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  asset_id: uuid('asset_id').references(() => assets.id),
  booking_id: uuid('booking_id').references(() => bookings.id),
  reporter_id: uuid('reporter_id').references(() => users.id),
  severity: varchar('severity', { length: 20 }).notNull(),
  description: text('description').notNull(),
  photo_url: text('photo_url'),
  status: varchar('status', { length: 30 }).default('open'),
  resolution_notes: text('resolution_notes'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

/* ------------------------------------------------------------------ */
/*  maintenance_rules                                                  */
/* ------------------------------------------------------------------ */
export const maintenanceRules = pgTable('maintenance_rules', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  asset_type_id: uuid('asset_type_id').references(() => assetTypes.id),
  rule_name: varchar('rule_name', { length: 255 }).notNull(),
  field: varchar('field', { length: 100 }).notNull(),
  operator: varchar('operator', { length: 10 }).notNull(),
  threshold_value: varchar('threshold_value', { length: 100 }).notNull(),
  severity: varchar('severity', { length: 30 }).notNull(),
  enabled: boolean('enabled').default(true),
  created_at: timestamp('created_at').defaultNow(),
});

/* ------------------------------------------------------------------ */
/*  maintenance_tickets                                                */
/* ------------------------------------------------------------------ */
export const maintenanceTickets = pgTable('maintenance_tickets', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  asset_id: uuid('asset_id').references(() => assets.id),
  rule_id: uuid('rule_id').references(() => maintenanceRules.id),
  ticket_type: varchar('ticket_type', { length: 30 }).notNull(),
  status: varchar('status', { length: 30 }).notNull().default('open'),
  severity: varchar('severity', { length: 30 }).notNull(),
  description: text('description').notNull(),
  assigned_to: uuid('assigned_to').references(() => users.id),
  parts_needed: text('parts_needed'),
  resolution_notes: text('resolution_notes'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
  completed_at: timestamp('completed_at'),
});

/* ------------------------------------------------------------------ */
/*  settlements                                                        */
/* ------------------------------------------------------------------ */
export const settlements = pgTable('settlements', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  operator_id: uuid('operator_id').references(() => users.id).notNull(),
  period_start: date('period_start').notNull(),
  period_end: date('period_end').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('draft'),
  total_due: numeric('total_due', { precision: 12, scale: 2 }).notNull().default('0'),
  total_payable: numeric('total_payable', { precision: 12, scale: 2 }).notNull().default('0'),
  net_amount: numeric('net_amount', { precision: 12, scale: 2 }).notNull().default('0'),
  deductions: jsonb('deductions').notNull().default({}),
  payment_reference: varchar('payment_reference', { length: 255 }),
  approved_by: uuid('approved_by').references(() => users.id),
  approved_at: timestamp('approved_at'),
  paid_at: timestamp('paid_at'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});
<<<<<<< HEAD

/* ------------------------------------------------------------------ */
/*  telemetry_syncs                                                    */
/* ------------------------------------------------------------------ */
export const telemetrySyncs = pgTable('telemetry_syncs', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  asset_id: uuid('asset_id').references(() => assets.id),
  source: varchar('source', { length: 30 }).notNull(),
  flight_hours_delta: numeric('flight_hours_delta', { precision: 10, scale: 1 }),
  battery_cycles_delta: integer('battery_cycles_delta'),
  firmware_version: varchar('firmware_version', { length: 50 }),
  fault_codes: jsonb('fault_codes').default([]),
  synced_at: timestamp('synced_at').defaultNow(),
  raw_payload: jsonb('raw_payload').default({}),
});
=======
>>>>>>> epic/SHD-8-settlement
