-- SHD-6: allocation_rules table
CREATE TABLE "allocation_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rule_name" varchar(255) NOT NULL,
	"operator_weight" numeric(5, 2) DEFAULT '1.0' NOT NULL,
	"max_allocation_pct" numeric(5, 2) DEFAULT '100' NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now()
);

--> statement-breakpoint

-- SHD-11: asset_baselines table
CREATE TABLE IF NOT EXISTS "asset_baselines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_id" uuid NOT NULL,
	"avg_flight_hours_per_show" numeric(10, 4) DEFAULT '0' NOT NULL,
	"stddev_flight_hours" numeric(10, 4) DEFAULT '0' NOT NULL,
	"avg_battery_drain_per_show" numeric(10, 4) DEFAULT '0' NOT NULL,
	"stddev_battery_drain" numeric(10, 4) DEFAULT '0' NOT NULL,
	"sample_count" integer DEFAULT 0 NOT NULL,
	"last_computed" timestamp DEFAULT now(),
	CONSTRAINT "asset_baselines_asset_id_unique" UNIQUE("asset_id")
);

--> statement-breakpoint

-- SHD-11: anomalies table
CREATE TABLE IF NOT EXISTS "anomalies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_id" uuid,
	"anomaly_type" varchar(50) NOT NULL,
	"field" varchar(100) NOT NULL,
	"expected_value" varchar(100),
	"actual_value" varchar(100),
	"sigma_distance" varchar(50),
	"severity" varchar(20) DEFAULT 'warning' NOT NULL,
	"status" varchar(30) DEFAULT 'new' NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now()
);

--> statement-breakpoint

-- SHD-11: analytics_config table
CREATE TABLE "analytics_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(100) UNIQUE NOT NULL,
	"value" varchar(255) NOT NULL,
	"updated_at" timestamp DEFAULT now()
);

--> statement-breakpoint

-- SHD-19: sponsors table
CREATE TABLE IF NOT EXISTS "sponsors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"logo_url" text,
	"campaign_tag" varchar(100),
	"contact_email" varchar(255),
	"user_id" uuid,
	"created_at" timestamp DEFAULT now()
);

--> statement-breakpoint

-- SHD-19: booking_sponsors junction table
CREATE TABLE IF NOT EXISTS "booking_sponsors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"sponsor_id" uuid NOT NULL,
	"campaign_name" varchar(255),
	"notes" text,
	"created_at" timestamp DEFAULT now()
);

--> statement-breakpoint
ALTER TABLE "asset_baselines" ADD CONSTRAINT "asset_baselines_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "anomalies" ADD CONSTRAINT "anomalies_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "anomalies" ADD CONSTRAINT "anomalies_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "sponsors" ADD CONSTRAINT "sponsors_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "booking_sponsors" ADD CONSTRAINT "booking_sponsors_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "booking_sponsors" ADD CONSTRAINT "booking_sponsors_sponsor_id_sponsors_id_fk" FOREIGN KEY ("sponsor_id") REFERENCES "public"."sponsors"("id") ON DELETE no action ON UPDATE no action;

--> statement-breakpoint

-- Seed default analytics config
INSERT INTO "analytics_config" ("id", "key", "value") VALUES
  (gen_random_uuid(), 'sigma_threshold', '2'),
  (gen_random_uuid(), 'detection_enabled', 'true')
ON CONFLICT DO NOTHING;

--> statement-breakpoint

-- Seed 5 default allocation rules (one per operator with equal weights)
INSERT INTO "allocation_rules" ("id", "rule_name", "operator_weight", "max_allocation_pct", "enabled") VALUES
  ('00000000-0000-4000-8000-d00000000001', 'NightBrite Drones Priority', 1.0, 100, true),
  ('00000000-0000-4000-8000-d00000000002', 'Orion Skies Priority', 1.0, 100, true),
  ('00000000-0000-4000-8000-d00000000003', 'Vegas Drone Works Priority', 1.0, 100, true),
  ('00000000-0000-4000-8000-d00000000004', 'Patriotic Air Priority', 1.0, 100, true),
  ('00000000-0000-4000-8000-d00000000005', 'Sky Harmony Fleet Priority', 1.0, 100, true)
ON CONFLICT DO NOTHING;
