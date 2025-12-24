CREATE TYPE "public"."member_event_type" AS ENUM('JOIN', 'LEAVE');--> statement-breakpoint
CREATE TYPE "public"."message_kind" AS ENUM('text', 'attachment', 'sticker', 'embed');--> statement-breakpoint
CREATE TABLE "message_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guild_id" varchar(256) NOT NULL,
	"channel_id" varchar(256) NOT NULL,
	"user_id" varchar(256) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"message_kind" "message_kind" NOT NULL,
	"is_bot" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member_lifecycle_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guild_id" varchar(256) NOT NULL,
	"user_id" varchar(256) NOT NULL,
	"event_type" "member_event_type" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "voice_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guild_id" varchar(256) NOT NULL,
	"channel_id" varchar(256) NOT NULL,
	"user_id" varchar(256) NOT NULL,
	"joined_at" timestamp NOT NULL,
	"left_at" timestamp,
	"duration_seconds" integer
);
