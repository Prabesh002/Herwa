CREATE TYPE "public"."payment_status" AS ENUM('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED');--> statement-breakpoint
CREATE TYPE "public"."reset_period" AS ENUM('DAILY', 'MONTHLY', 'YEARLY');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('ACTIVE', 'EXPIRED', 'CANCELED', 'REFUNDED');--> statement-breakpoint
CREATE TABLE "subscription_tiers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"price_monthly" integer NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "system_commands" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"feature_id" uuid NOT NULL,
	"discord_command_name" varchar(255) NOT NULL,
	"description" text,
	"is_maintenance" boolean DEFAULT false NOT NULL,
	CONSTRAINT "system_commands_discord_command_name_unique" UNIQUE("discord_command_name")
);
--> statement-breakpoint
CREATE TABLE "system_features" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"is_global_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "system_features_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "tier_features" (
	"tier_id" uuid NOT NULL,
	"feature_id" uuid NOT NULL,
	"usage_limit" integer,
	"reset_period" "reset_period",
	CONSTRAINT "tier_features_tier_id_feature_id_pk" PRIMARY KEY("tier_id","feature_id")
);
--> statement-breakpoint
CREATE TABLE "guild_command_permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guild_id" varchar(256) NOT NULL,
	"command_name" varchar(255) NOT NULL,
	"allowed_role_ids" text[],
	"allowed_channel_ids" text[],
	"deny_role_ids" text[],
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guild_feature_overrides" (
	"guild_id" varchar(256) NOT NULL,
	"feature_id" uuid NOT NULL,
	"is_enabled" boolean NOT NULL,
	CONSTRAINT "guild_feature_overrides_guild_id_feature_id_pk" PRIMARY KEY("guild_id","feature_id")
);
--> statement-breakpoint
CREATE TABLE "guild_feature_usage" (
	"guild_id" varchar(256) NOT NULL,
	"feature_id" uuid NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "guild_feature_usage_guild_id_feature_id_period_start_pk" PRIMARY KEY("guild_id","feature_id","period_start")
);
--> statement-breakpoint
CREATE TABLE "guild_settings" (
	"guild_id" varchar(256) PRIMARY KEY NOT NULL,
	"tier_id" uuid NOT NULL,
	"subscription_expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guild_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guild_id" varchar(256) NOT NULL,
	"tier_id" uuid NOT NULL,
	"starts_at" timestamp NOT NULL,
	"ends_at" timestamp NOT NULL,
	"status" "subscription_status" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guild_id" varchar(256) NOT NULL,
	"subscription_id" uuid NOT NULL,
	"amount" integer NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"provider" varchar(50) NOT NULL,
	"provider_tx_id" varchar(255),
	"status" "payment_status" NOT NULL,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "system_commands" ADD CONSTRAINT "system_commands_feature_id_system_features_id_fk" FOREIGN KEY ("feature_id") REFERENCES "public"."system_features"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tier_features" ADD CONSTRAINT "tier_features_tier_id_subscription_tiers_id_fk" FOREIGN KEY ("tier_id") REFERENCES "public"."subscription_tiers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tier_features" ADD CONSTRAINT "tier_features_feature_id_system_features_id_fk" FOREIGN KEY ("feature_id") REFERENCES "public"."system_features"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guild_command_permissions" ADD CONSTRAINT "guild_command_permissions_guild_id_guild_settings_guild_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guild_settings"("guild_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guild_command_permissions" ADD CONSTRAINT "guild_command_permissions_command_name_system_commands_discord_command_name_fk" FOREIGN KEY ("command_name") REFERENCES "public"."system_commands"("discord_command_name") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guild_feature_overrides" ADD CONSTRAINT "guild_feature_overrides_guild_id_guild_settings_guild_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guild_settings"("guild_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guild_feature_overrides" ADD CONSTRAINT "guild_feature_overrides_feature_id_system_features_id_fk" FOREIGN KEY ("feature_id") REFERENCES "public"."system_features"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guild_feature_usage" ADD CONSTRAINT "guild_feature_usage_guild_id_guild_settings_guild_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guild_settings"("guild_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guild_feature_usage" ADD CONSTRAINT "guild_feature_usage_feature_id_system_features_id_fk" FOREIGN KEY ("feature_id") REFERENCES "public"."system_features"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guild_settings" ADD CONSTRAINT "guild_settings_tier_id_subscription_tiers_id_fk" FOREIGN KEY ("tier_id") REFERENCES "public"."subscription_tiers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guild_subscriptions" ADD CONSTRAINT "guild_subscriptions_guild_id_guild_settings_guild_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guild_settings"("guild_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guild_subscriptions" ADD CONSTRAINT "guild_subscriptions_tier_id_subscription_tiers_id_fk" FOREIGN KEY ("tier_id") REFERENCES "public"."subscription_tiers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_subscription_id_guild_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."guild_subscriptions"("id") ON DELETE no action ON UPDATE no action;