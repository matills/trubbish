CREATE TYPE "public"."account_source" AS ENUM('CATALOG', 'BROWSER', 'CONNECTED_APPS', 'BREACH', 'GUIDED', 'MANUAL');--> statement-breakpoint
CREATE TYPE "public"."account_status" AS ENUM('TO_REVIEW', 'KEEP', 'IN_PROGRESS', 'DELETED');--> statement-breakpoint
CREATE TYPE "public"."category" AS ENUM('SOCIAL', 'MESSAGING', 'SHOPPING', 'STREAMING', 'GAMING', 'TRAVEL', 'FOOD', 'PRODUCTIVITY', 'FINANCE', 'WORK', 'DATING', 'EDUCATION', 'HEALTH', 'GOVERNMENT', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."difficulty" AS ENUM('EASY', 'MEDIUM', 'HARD', 'IMPOSSIBLE');--> statement-breakpoint
CREATE TYPE "public"."law" AS ENUM('AR_25326', 'GDPR');--> statement-breakpoint
CREATE TYPE "public"."request_status" AS ENUM('DRAFT', 'SENT', 'ANSWERED', 'IGNORED');--> statement-breakpoint
CREATE TYPE "public"."scan_status" AS ENUM('QUEUED', 'RUNNING', 'DONE', 'FAILED');--> statement-breakpoint
CREATE TABLE "breach_scans" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"status" "scan_status" DEFAULT 'QUEUED' NOT NULL,
	"demo" boolean DEFAULT false NOT NULL,
	"payload" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "catalog_services" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"domain" text NOT NULL,
	"aliases" text[] DEFAULT '{}' NOT NULL,
	"category" "category" NOT NULL,
	"difficulty" "difficulty" NOT NULL,
	"delete_url" text,
	"recovery_url" text,
	"privacy_email" text,
	"steps" text,
	CONSTRAINT "catalog_services_slug_unique" UNIQUE("slug"),
	CONSTRAINT "catalog_services_domain_unique" UNIQUE("domain")
);
--> statement-breakpoint
CREATE TABLE "deletion_requests" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"account_id" bigint NOT NULL,
	"law" "law" NOT NULL,
	"status" "request_status" DEFAULT 'DRAFT' NOT NULL,
	"payload" text NOT NULL,
	"sent_at" timestamp with time zone,
	"due_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tracked_accounts" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"domain_hash" text NOT NULL,
	"payload" text NOT NULL,
	"status" "account_status" DEFAULT 'TO_REVIEW' NOT NULL,
	"source" "account_source" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"closed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_login_at" timestamp with time zone,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "breach_scans" ADD CONSTRAINT "breach_scans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deletion_requests" ADD CONSTRAINT "deletion_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deletion_requests" ADD CONSTRAINT "deletion_requests_account_id_tracked_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."tracked_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracked_accounts" ADD CONSTRAINT "tracked_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "breach_scans_user_created_idx" ON "breach_scans" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "catalog_services_category_idx" ON "catalog_services" USING btree ("category");--> statement-breakpoint
CREATE INDEX "deletion_requests_user_idx" ON "deletion_requests" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "deletion_requests_account_idx" ON "deletion_requests" USING btree ("account_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tracked_accounts_user_domain_uq" ON "tracked_accounts" USING btree ("user_id","domain_hash");--> statement-breakpoint
CREATE INDEX "tracked_accounts_user_status_idx" ON "tracked_accounts" USING btree ("user_id","status");