import { IEventHandlerConstructor } from '@/discord/events/core/event.contract';
import { MemberAddHandler } from './handlers/member-add.handler';
import { MemberRemoveHandler } from './handlers/member-remove.handler';

export const MemberEventHandlers: IEventHandlerConstructor[] = [
  MemberAddHandler,
  MemberRemoveHandler,
];