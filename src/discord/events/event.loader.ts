import { EventRegistryService } from '@/discord/events/event-registry.service';
import { MessageEventHandlers } from '@/discord/events/modules/message/message.registrar';

export function loadEvents(registry: EventRegistryService): void {
  registry.register(MessageEventHandlers);
}