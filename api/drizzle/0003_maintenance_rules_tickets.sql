CREATE TABLE "maintenance_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_type_id" uuid,
	"rule_name" varchar(255) NOT NULL,
	"field" varchar(100) NOT NULL,
	"operator" varchar(10) NOT NULL,
	"threshold_value" varchar(100) NOT NULL,
	"severity" varchar(30) NOT NULL,
	"enabled" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
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
	"completed_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "maintenance_rules" ADD CONSTRAINT "maintenance_rules_asset_type_id_asset_types_id_fk" FOREIGN KEY ("asset_type_id") REFERENCES "public"."asset_types"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "maintenance_tickets" ADD CONSTRAINT "maintenance_tickets_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "maintenance_tickets" ADD CONSTRAINT "maintenance_tickets_rule_id_maintenance_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."maintenance_rules"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "maintenance_tickets" ADD CONSTRAINT "maintenance_tickets_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
