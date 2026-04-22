-- SkyHarmony: squashed initial migration
-- All tables from schema.ts in dependency order

CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"role" varchar(50) DEFAULT 'OperatorStaff' NOT NULL,
	"organization" varchar(255),
	"region" varchar(255),
	"fleet_size" integer,
	"onboarded" varchar(10) DEFAULT 'false',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "asset_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "asset_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_type_id" uuid,
	"serial_number" varchar(100) NOT NULL,
	"manufacturer" varchar(255) NOT NULL,
	"model" varchar(255) NOT NULL,
	"status" varchar(50) DEFAULT 'available' NOT NULL,
	"firmware_version" varchar(50),
	"flight_hours" numeric(10, 1) DEFAULT '0',
	"battery_cycles" integer DEFAULT 0,
	"typed_attributes" jsonb DEFAULT '{}'::jsonb,
	"current_operator_id" uuid,
	"parent_asset_id" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "assets_serial_number_unique" UNIQUE("serial_number"),
	CONSTRAINT "assets_asset_type_id_asset_types_id_fk" FOREIGN KEY ("asset_type_id") REFERENCES "asset_types"("id") ON DELETE no action ON UPDATE no action,
	CONSTRAINT "assets_current_operator_id_users_id_fk" FOREIGN KEY ("current_operator_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"operator_id" uuid,
	"operator_name" varchar(255),
	"show_date" timestamp NOT NULL,
	"end_date" timestamp,
	"drone_count" integer NOT NULL,
	"location" varchar(255) NOT NULL,
	"status" varchar(50) DEFAULT 'pending',
	"notes" text,
	"allocated_assets" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "bookings_operator_id_users_id_fk" FOREIGN KEY ("operator_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action
);
--> statement-breakpoint
CREATE TABLE "audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_id" uuid,
	"field_changed" varchar(100),
	"old_value" text,
	"new_value" text NOT NULL,
	"changed_by" uuid,
	"changed_at" timestamp DEFAULT now(),
	CONSTRAINT "audit_events_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE no action ON UPDATE no action,
	CONSTRAINT "audit_events_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action
);
--> statement-breakpoint
CREATE TABLE "custody_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_id" uuid,
	"action" varchar(20) NOT NULL,
	"actor_id" uuid,
	"booking_id" uuid,
	"mac_address" varchar(50),
	"timestamp" timestamp DEFAULT now(),
	"notes" text,
	CONSTRAINT "custody_events_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE no action ON UPDATE no action,
	CONSTRAINT "custody_events_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action,
	CONSTRAINT "custody_events_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE no action ON UPDATE no action
);
--> statement-breakpoint
CREATE TABLE "incidents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_id" uuid,
	"booking_id" uuid,
	"reporter_id" uuid,
	"severity" varchar(20) NOT NULL,
	"description" text NOT NULL,
	"photo_url" text,
	"status" varchar(30) DEFAULT 'open',
	"resolution_notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "incidents_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE no action ON UPDATE no action,
	CONSTRAINT "incidents_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE no action ON UPDATE no action,
	CONSTRAINT "incidents_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action
);
--> statement-breakpoint
CREATE TABLE "manifests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid,
	"status" varchar(50) DEFAULT 'draft' NOT NULL,
	"created_by" uuid,
	"assets" jsonb DEFAULT '[]'::jsonb,
	"pickup_location" varchar(255),
	"delivery_location" varchar(255),
	"pickup_date" timestamp,
	"delivery_date" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "manifests_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE no action ON UPDATE no action,
	CONSTRAINT "manifests_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action
);
--> statement-breakpoint
CREATE TABLE "transport_legs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"manifest_id" uuid,
	"leg_number" integer NOT NULL,
	"origin" varchar(255),
	"destination" varchar(255),
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"driver_name" varchar(255),
	"vehicle_info" varchar(255),
	"departed_at" timestamp,
	"arrived_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "transport_legs_manifest_id_manifests_id_fk" FOREIGN KEY ("manifest_id") REFERENCES "manifests"("id") ON DELETE no action ON UPDATE no action
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid,
	"operator_id" uuid,
	"operator_name" varchar(255),
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"line_items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"subtotal" numeric(12, 2) DEFAULT '0' NOT NULL,
	"tax" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total" numeric(12, 2) DEFAULT '0' NOT NULL,
	"due_date" timestamp,
	"paid_date" timestamp,
	"payment_method" varchar(20) DEFAULT 'pending',
	"stripe_payment_id" varchar(255),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "invoices_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE no action ON UPDATE no action,
	CONSTRAINT "invoices_operator_id_users_id_fk" FOREIGN KEY ("operator_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action
);
--> statement-breakpoint
CREATE TABLE "maintenance_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_type_id" uuid,
	"rule_name" varchar(255) NOT NULL,
	"field" varchar(100) NOT NULL,
	"operator" varchar(10) NOT NULL,
	"threshold_value" varchar(100) NOT NULL,
	"severity" varchar(30) NOT NULL,
	"enabled" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "maintenance_rules_asset_type_id_asset_types_id_fk" FOREIGN KEY ("asset_type_id") REFERENCES "asset_types"("id") ON DELETE no action ON UPDATE no action
);
--> statement-breakpoint
CREATE TABLE "maintenance_tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_id" uuid,
	"rule_id" uuid,
	"ticket_type" varchar(30) NOT NULL,
	"status" varchar(30) DEFAULT 'open' NOT NULL,
	"severity" varchar(30) NOT NULL,
	"description" text NOT NULL,
	"assigned_to" uuid,
	"parts_needed" text,
	"resolution_notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"completed_at" timestamp,
	CONSTRAINT "maintenance_tickets_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE no action ON UPDATE no action,
	CONSTRAINT "maintenance_tickets_rule_id_maintenance_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "maintenance_rules"("id") ON DELETE no action ON UPDATE no action,
	CONSTRAINT "maintenance_tickets_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action
);
--> statement-breakpoint
CREATE TABLE "settlements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"operator_id" uuid NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"total_due" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total_payable" numeric(12, 2) DEFAULT '0' NOT NULL,
	"net_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"deductions" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"payment_reference" varchar(255),
	"approved_by" uuid,
	"approved_at" timestamp,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "settlements_operator_id_users_id_fk" FOREIGN KEY ("operator_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action,
	CONSTRAINT "settlements_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action
);
--> statement-breakpoint
CREATE TABLE "cooperative_terms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"version" integer NOT NULL,
	"brokerage_pct" numeric(5, 2) NOT NULL,
	"allocation_fee_per_drone" numeric(10, 2) NOT NULL,
	"standby_fee_per_drone" numeric(10, 2) NOT NULL,
	"insurance_pool_pct" numeric(5, 2) NOT NULL,
	"net_payment_days" integer NOT NULL,
	"damage_policy" text,
	"effective_date" date NOT NULL,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "cooperative_terms_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action
);
--> statement-breakpoint
CREATE TABLE "asset_baselines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_id" uuid NOT NULL UNIQUE,
	"avg_flight_hours_per_show" numeric(10, 2),
	"stddev_flight_hours" numeric(10, 4),
	"avg_battery_drain_per_show" numeric(10, 2),
	"stddev_battery_drain" numeric(10, 4),
	"sample_count" integer DEFAULT 0,
	"last_computed" timestamp DEFAULT now(),
	CONSTRAINT "asset_baselines_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE no action ON UPDATE no action
);
--> statement-breakpoint
CREATE TABLE "anomalies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_id" uuid,
	"anomaly_type" varchar(30) NOT NULL,
	"field" varchar(100) NOT NULL,
	"expected_value" numeric(12, 4),
	"actual_value" numeric(12, 4),
	"sigma_distance" numeric(8, 2),
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "anomalies_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE no action ON UPDATE no action,
	CONSTRAINT "anomalies_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action
);
--> statement-breakpoint
CREATE TABLE "sponsors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"logo_url" text,
	"campaign_tag" varchar(100),
	"contact_email" varchar(255),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "booking_sponsors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"sponsor_id" uuid NOT NULL,
	"campaign_name" varchar(255),
	"notes" text,
	CONSTRAINT "booking_sponsors_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE no action ON UPDATE no action,
	CONSTRAINT "booking_sponsors_sponsor_id_sponsors_id_fk" FOREIGN KEY ("sponsor_id") REFERENCES "sponsors"("id") ON DELETE no action ON UPDATE no action
);
--> statement-breakpoint
CREATE TABLE "telemetry_syncs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_id" uuid,
	"source" varchar(30) NOT NULL,
	"flight_hours_delta" numeric(10, 1),
	"battery_cycles_delta" integer,
	"firmware_version" varchar(50),
	"fault_codes" jsonb DEFAULT '[]'::jsonb,
	"synced_at" timestamp DEFAULT now(),
	"raw_payload" jsonb DEFAULT '{}'::jsonb,
	CONSTRAINT "telemetry_syncs_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE no action ON UPDATE no action
);
