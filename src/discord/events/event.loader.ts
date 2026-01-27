import { EventRegistryService } from '@/discord/events/event-registry.service';
import { MessageEventHandlers } from '@/discord/events/modules/message/message.registrar';
import { MemberEventHandlers } from '@/discord/events/modules/member/member.registrar';
import { VoiceEventHandlers } from '@/discord/events/modules/voice/voice.registrar';
import { GuildEventHandlers } from '@/discord/events/modules/guild/guild.registrar'; 

export function loadEvents(registry: EventRegistryService): void {
  registry.register(MessageEventHandlers);
  registry.register(MemberEventHandlers);
  registry.register(VoiceEventHandlers);
  registry.register(GuildEventHandlers);
}