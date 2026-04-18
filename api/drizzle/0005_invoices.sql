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
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_operator_id_users_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;