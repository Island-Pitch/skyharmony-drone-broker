import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  numeric,
  jsonb,
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
