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
	"updated_at" timestamp DEFAULT now()
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
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "manifests" ADD CONSTRAINT "manifests_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manifests" ADD CONSTRAINT "manifests_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transport_legs" ADD CONSTRAINT "transport_legs_manifest_id_manifests_id_fk" FOREIGN KEY ("manifest_id") REFERENCES "public"."manifests"("id") ON DELETE no action ON UPDATE no action;