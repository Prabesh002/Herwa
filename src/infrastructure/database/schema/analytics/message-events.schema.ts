import { pgTable, uuid, varchar, timestamp, boolean } from 'drizzle-orm/pg-core';
import { messageKindEnum } from './enums.schema';

export const messageEvents = pgTable('message_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  guildId: varchar('guild_id', { length: 256 }).notNull(),
  channelId: varchar('channel_id', { length: 256 }).notNull(),
  userId: varchar('user_id', { length: 256 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  messageKind: messageKindEnum('message_kind').notNull(),
  isBot: boolean('is_bot').notNull(),
  chIngestedAt: timestamp('ch_ingested_at'), 
});