import { AppContainer } from '@/core/app-container';
import { DiscordClientService } from '@/discord/core/discord-client.service';
import { CommandRegistryService } from '@/discord/commands/command-registry.service';
import { CommandPublishingService } from '@/discord/core/command-publishing.service';
import { InteractionHandlingService } from '@/discord/core/interaction-handling.service';
import { loadCommands } from '@/discord/commands/command.loader';

export function loadDiscordModule(container: AppContainer): void {
  container.register(DiscordClientService, new DiscordClientService());
  container.register(CommandRegistryService, new CommandRegistryService());
  container.register(CommandPublishingService, new CommandPublishingService());
  container.register(InteractionHandlingService, new InteractionHandlingService());

  const commandRegistry = container.get(CommandRegistryService);
  loadCommands(commandRegistry);
}