ALTER TABLE "files" ADD COLUMN "thumbnail_s3_key" text;--> statement-breakpoint
ALTER TABLE "files" ADD COLUMN "is_starred" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "name" text DEFAULT 'User' NOT NULL;