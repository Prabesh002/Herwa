import { AppContainer } from '@/core/app-container';
import { DiscordClientService } from '@/discord/core/discord-client.service';
import { CommandRegistryService } from '@/discord/commands/command-registry.service';
import { CommandPublishingService } from '@/discord/core/command-publishing.service';
import { InteractionHandlingService } from '@/discord/core/interaction-handling.service';
import { EventRegistryService } from '@/discord/events/event-registry.service';
import { EventHandlingService } from '@/discord/core/event-handling.service';
import { VoiceSessionManager } from '@/discord/voice/voice-session-manager.service';
import { loadCommands } from '@/discord/commands/command.loader';
import { loadEvents } from '@/discord/events/event.loader';

export function loadDiscordModule(container: AppContainer): void {
  container.register(DiscordClientService, new DiscordClientService());

  container.register(CommandRegistryService, new CommandRegistryService());
  container.register(CommandPublishingService, new CommandPublishingService());
  container.register(InteractionHandlingService, new InteractionHandlingService());

  container.register(EventRegistryService, new EventRegistryService());
  container.register(EventHandlingService, new EventHandlingService());
  container.register(VoiceSessionManager, new VoiceSessionManager());

  const commandRegistry = container.get(CommandRegistryService);
  loadCommands(commandRegistry);

  const eventRegistry = container.get(EventRegistryService);
  loadEvents(eventRegistry);
}