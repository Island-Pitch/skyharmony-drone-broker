CREATE TABLE "telemetry_syncs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_id" uuid,
	"source" varchar(30) NOT NULL,
	"flight_hours_delta" numeric(10, 1),
	"battery_cycles_delta" integer,
	"firmware_version" varchar(50),
	"fault_codes" jsonb DEFAULT '[]'::jsonb,
	"synced_at" timestamp DEFAULT now(),
	"raw_payload" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
ALTER TABLE "telemetry_syncs" ADD CONSTRAINT "telemetry_syncs_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;
