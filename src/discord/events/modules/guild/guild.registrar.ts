import { IEventHandlerConstructor } from '@/discord/events/core/event.contract';
import { GuildCreateHandler } from './handlers/guild-create.handler';

export const GuildEventHandlers: IEventHandlerConstructor[] = [
  GuildCreateHandler,
];