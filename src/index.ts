import 'dotenv/config';
import { Events } from 'discord.js';
import { AppContainer } from '@/core/app-container';
import { ConfigService } from '@/infrastructure/config/config.service';
import { createLogger } from '@/infrastructure/logging/logger';
import { initializeErrorHandlers } from '@/infrastructure/logging/errorHandler';
import { DiscordClientService } from '@/discord/core/discord-client.service';
import { CommandPublishingService } from '@/discord/core/command-publishing.service';
import { InteractionHandlingService } from '@/discord/core/interaction-handling.service';
import { EventHandlingService } from '@/discord/core/event-handling.service';
import { composeApplication } from '@/core/app.composer';

async function bootstrap() {
  const container = AppContainer.getInstance();
  const configService = new ConfigService();
  container.register(ConfigService, configService);

  const rootLogger = createLogger(configService.get().logLevel);
  initializeErrorHandlers(rootLogger);
  
  rootLogger.info('Herwa is starting...');
  
  composeApplication(container);

  const interactionHandler = container.get(InteractionHandlingService);
  interactionHandler.start();

  const eventHandler = container.get(EventHandlingService);
  eventHandler.start();

  const discordClient = container.get(DiscordClientService);
  const commandPublisher = container.get(CommandPublishingService);

  discordClient.getClient().once(Events.ClientReady, async () => {
    await commandPublisher.publish();
  });

  await discordClient.start();
}

bootstrap();