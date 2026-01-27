ALTER TABLE "message_events" ADD COLUMN "ch_ingested_at" timestamp;--> statement-breakpoint
ALTER TABLE "member_lifecycle_events" ADD COLUMN "ch_ingested_at" timestamp;--> statement-breakpoint
ALTER TABLE "voice_sessions" ADD COLUMN "ch_ingested_at" timestamp;