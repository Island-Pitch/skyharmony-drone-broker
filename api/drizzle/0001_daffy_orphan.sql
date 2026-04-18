ALTER TABLE "users" ADD COLUMN "organization" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "region" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "fleet_size" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "onboarded" varchar(10) DEFAULT 'false';