import { pgTable, uuid, varchar, boolean, timestamp, integer, primaryKey, text, unique } from 'drizzle-orm/pg-core';
import { subscriptionTiers, systemFeatures, systemCommands } from './catalog.schema';
import { relations } from 'drizzle-orm';

export const guildSettings = pgTable('guild_settings', {
  guildId: varchar('guild_id', { length: 256 }).primaryKey(),
  tierId: uuid('tier_id').references(() => subscriptionTiers.id).notNull(),
  subscriptionExpiresAt: timestamp('subscription_expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const guildFeatureOverrides = pgTable('guild_feature_overrides', {
  guildId: varchar('guild_id', { length: 256 }).references(() => guildSettings.guildId).notNull(),
  featureId: uuid('feature_id').references(() => systemFeatures.id).notNull(),
  isEnabled: boolean('is_enabled').notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.guildId, t.featureId] }),
}));

export const guildFeatureUsage = pgTable('guild_feature_usage', {
  guildId: varchar('guild_id', { length: 256 }).references(() => guildSettings.guildId).notNull(),
  featureId: uuid('feature_id').references(() => systemFeatures.id).notNull(),
  periodStart: timestamp('period_start').notNull(),
  periodEnd: timestamp('period_end').notNull(),
  usageCount: integer('usage_count').default(0).notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.guildId, t.featureId, t.periodStart] }),
}));

export const guildCommandPermissions = pgTable('guild_command_permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  guildId: varchar('guild_id', { length: 256 }).references(() => guildSettings.guildId).notNull(),
  commandName: varchar('command_name', { length: 255 }).references(() => systemCommands.discordCommandName).notNull(),
  
  allowedRoleIds: text('allowed_role_ids').array(),
  allowedChannelIds: text('allowed_channel_ids').array(),
  denyRoleIds: text('deny_role_ids').array(),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({unq: unique().on(t.guildId, t.commandName),
}));

export const guildSettingsRelations = relations(guildSettings, ({ one, many }) => ({
  tier: one(subscriptionTiers, {
    fields: [guildSettings.tierId],
    references: [subscriptionTiers.id],
  }),
  overrides: many(guildFeatureOverrides),
  permissions: many(guildCommandPermissions),
}));

export const guildFeatureOverridesRelations = relations(guildFeatureOverrides, ({ one }) => ({
  guild: one(guildSettings, {
    fields: [guildFeatureOverrides.guildId],
    references: [guildSettings.guildId],
  }),
  feature: one(systemFeatures, {
    fields: [guildFeatureOverrides.featureId],
    references: [systemFeatures.id],
  }),
}));

export const guildCommandPermissionsRelations = relations(guildCommandPermissions, ({ one }) => ({
  guild: one(guildSettings, {
    fields: [guildCommandPermissions.guildId],
    references: [guildSettings.guildId],
  }),
  command: one(systemCommands, {
    fields: [guildCommandPermissions.commandName],
    references: [systemCommands.discordCommandName],
  }),
}));