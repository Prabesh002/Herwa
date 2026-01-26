import { pgTable, uuid, varchar, integer, boolean, timestamp, text, primaryKey } from 'drizzle-orm/pg-core';
import { resetPeriodEnum } from './enums.schema';

export const subscriptionTiers = pgTable('subscription_tiers', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  priceMonthly: integer('price_monthly').notNull(),
  isDefault: boolean('is_default').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const systemFeatures = pgTable('system_features', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  isGlobalEnabled: boolean('is_global_enabled').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const tierFeatures = pgTable('tier_features', {
  tierId: uuid('tier_id').references(() => subscriptionTiers.id).notNull(),
  featureId: uuid('feature_id').references(() => systemFeatures.id).notNull(),
  usageLimit: integer('usage_limit'),
  resetPeriod: resetPeriodEnum('reset_period'),
}, (t) => ({
  pk: primaryKey({ columns: [t.tierId, t.featureId] }),
}));

export const systemCommands = pgTable('system_commands', {
  id: uuid('id').primaryKey().defaultRandom(),
  featureId: uuid('feature_id').references(() => systemFeatures.id).notNull(),
  discordCommandName: varchar('discord_command_name', { length: 255 }).notNull().unique(),
  description: text('description'),
  isMaintenance: boolean('is_maintenance').default(false).notNull(),
});