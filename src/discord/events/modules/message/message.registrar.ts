import { IEventHandlerConstructor } from '@/discord/events/core/event.contract';
import { MessageLoggerHandler } from './handlers/message-logger.handler';


export const MessageEventHandlers: IEventHandlerConstructor[] = [
  MessageLoggerHandler,
];