import { pgTable, uuid, varchar, integer, boolean, timestamp, text, primaryKey } from 'drizzle-orm/pg-core';
import { resetPeriodEnum } from './enums.schema';
import { relations } from 'drizzle-orm';
import { guildSettings } from './entitlement.schema';

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

export const subscriptionTiersRelations = relations(subscriptionTiers, ({ many }) => ({
  tierFeatures: many(tierFeatures),
  guilds: many(guildSettings),
}));

export const systemFeaturesRelations = relations(systemFeatures, ({ many }) => ({
  commands: many(systemCommands),
  tierLinks: many(tierFeatures),
}));

export const tierFeaturesRelations = relations(tierFeatures, ({ one }) => ({
  tier: one(subscriptionTiers, {
    fields: [tierFeatures.tierId],
    references: [subscriptionTiers.id],
  }),
  feature: one(systemFeatures, {
    fields: [tierFeatures.featureId],
    references: [systemFeatures.id],
  }),
}));

export const systemCommandsRelations = relations(systemCommands, ({ one }) => ({
  feature: one(systemFeatures, {
    fields: [systemCommands.featureId],
    references: [systemFeatures.id],
  }),
}));