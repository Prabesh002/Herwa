import { EventRegistryService } from '@/discord/events/event-registry.service';
import { MessageEventHandlers } from '@/discord/events/modules/message/message.registrar';
import { MemberEventHandlers } from '@/discord/events/modules/member/member.registrar';

export function loadEvents(registry: EventRegistryService): void {
  registry.register(MessageEventHandlers);
  registry.register(MemberEventHandlers);
}