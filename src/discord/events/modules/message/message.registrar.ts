import { IEventHandlerConstructor } from '@/discord/events/core/event.contract';
import { MessageCreateHandler } from './handlers/message-create.handler';

export const MessageEventHandlers: IEventHandlerConstructor[] = [
  MessageCreateHandler,
];