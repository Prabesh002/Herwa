import 'dotenv/config';
import { AppContainer } from '@/core/app-container';
import { ConfigService } from '@/infrastructure/config/config.service';
import { createLogger } from '@/infrastructure/logging/logger';
import { initializeErrorHandlers } from '@/infrastructure/logging/errorHandler';
import { DiscordClientService } from '@/discord/core/discord-client.service';
import { CommandRegistryService } from '@/discord/commands/command-registry.service';
import { CommandPublishingService } from '@/discord/core/command-publishing.service';
import { InteractionHandlingService } from '@/discord/core/interaction-handling.service';
import { UtilityCommands } from '@/discord/commands/modules/utility/utility.registrar';

async function bootstrap() {
  const container = AppContainer.getInstance();
  const configService = new ConfigService();
  container.register(ConfigService, configService);

  const rootLogger = createLogger(configService.get().logLevel);
  initializeErrorHandlers(rootLogger);
  
  rootLogger.info('Herwa is starting...');
  
  container.register(DiscordClientService, new DiscordClientService());
  container.register(CommandRegistryService, new CommandRegistryService());
  container.register(CommandPublishingService, new CommandPublishingService());
  container.register(InteractionHandlingService, new InteractionHandlingService());

  const commandRegistry = container.get(CommandRegistryService);
  commandRegistry.register(UtilityCommands);
  
  const interactionHandler = container.get(InteractionHandlingService);
  interactionHandler.start();

  const discordClient = container.get(DiscordClientService);
  const commandPublisher = container.get(CommandPublishingService);

  discordClient.getClient().once('ready', async () => {
    await commandPublisher.publish();
  });

  await discordClient.start();
}

bootstrap();