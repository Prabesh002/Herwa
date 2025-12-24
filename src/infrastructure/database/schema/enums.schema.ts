import { pgEnum } from 'drizzle-orm/pg-core';

export const messageKindEnum = pgEnum('message_kind', [
  'text',
  'attachment',
  'sticker',
  'embed',
]);

export const memberEventTypeEnum = pgEnum('member_event_type', [
  'JOIN',
  'LEAVE',
]);

export type MessageKind = typeof messageKindEnum.enumValues[number];