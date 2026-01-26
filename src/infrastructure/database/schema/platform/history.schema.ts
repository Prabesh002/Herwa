import { pgTable, uuid, varchar, timestamp, integer } from 'drizzle-orm/pg-core';
import { subscriptionTiers } from './catalog.schema';
import { guildSettings } from './entitlement.schema';
import { subscriptionStatusEnum, paymentStatusEnum } from './enums.schema';

export const guildSubscriptions = pgTable('guild_subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  guildId: varchar('guild_id', { length: 256 }).references(() => guildSettings.guildId).notNull(),
  tierId: uuid('tier_id').references(() => subscriptionTiers.id).notNull(),
  startsAt: timestamp('starts_at').notNull(),
  endsAt: timestamp('ends_at').notNull(),
  status: subscriptionStatusEnum('status').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  guildId: varchar('guild_id', { length: 256 }).notNull(),
  subscriptionId: uuid('subscription_id').references(() => guildSubscriptions.id).notNull(),
  amount: integer('amount').notNull(),
  currency: varchar('currency', { length: 3 }).default('USD').notNull(),
  provider: varchar('provider', { length: 50 }).notNull(),
  providerTxId: varchar('provider_tx_id', { length: 255 }),
  status: paymentStatusEnum('status').notNull(),
  paidAt: timestamp('paid_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});