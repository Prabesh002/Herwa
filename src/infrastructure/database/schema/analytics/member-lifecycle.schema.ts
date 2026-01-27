import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';
import { memberEventTypeEnum } from './enums.schema';

export const memberLifecycleEvents = pgTable('member_lifecycle_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  guildId: varchar('guild_id', { length: 256 }).notNull(),
  userId: varchar('user_id', { length: 256 }).notNull(),
  eventType: memberEventTypeEnum('event_type').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  chIngestedAt: timestamp('ch_ingested_at'),
});