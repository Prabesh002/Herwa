import { pgTable, uuid, varchar, timestamp, integer } from 'drizzle-orm/pg-core';

export const voiceSessions = pgTable('voice_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  guildId: varchar('guild_id', { length: 256 }).notNull(),
  channelId: varchar('channel_id', { length: 256 }).notNull(),
  userId: varchar('user_id', { length: 256 }).notNull(),
  joinedAt: timestamp('joined_at').notNull(),
  leftAt: timestamp('left_at'),
  durationSeconds: integer('duration_seconds'),
  chIngestedAt: timestamp('ch_ingested_at'),
});