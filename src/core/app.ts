import { Events } from 'discord.js';
import { AppContainer } from '@/core/app-container';
import { ConfigService } from '@/infrastructure/config/config.service';
import { createLogger, Logger } from '@/infrastructure/logging/logger';
import { initializeErrorHandlers } from '@/infrastructure/logging/errorHandler';
import { DiscordClientService } from '@/discord/core/discord-client.service';
import { CommandPublishingService } from '@/discord/core/command-publishing.service';
import { InteractionHandlingService } from '@/discord/core/interaction-handling.service';
import { EventHandlingService } from '@/discord/core/event-handling.service';
import { composeApplication } from '@/core/app.composer';
import { ClickHouseService } from '@/infrastructure/analytics/core/clickhouse.service';
import { RedisService } from '@/infrastructure/redis/redis.service';
import { EntitlementService } from './services/entitlement.service';

export class App {
  private readonly container: AppContainer;
  private readonly logger: Logger;

  constructor() {
    this.container = AppContainer.getInstance();
    const configService = new ConfigService();
    this.container.register(ConfigService, configService);

    this.logger = createLogger(configService.get().logLevel);
    initializeErrorHandlers(this.logger);
  }

  public async start(): Promise<void> {
    this.logger.info('Herwa is starting...');

    composeApplication(this.container);

    const analyticsService = this.container.get(ClickHouseService);
    await analyticsService.connect();

    const redisService = this.container.get(RedisService);
    await redisService.connect();

    const entitlementService = this.container.get(EntitlementService);
    await entitlementService.warmupGlobalCommands();
    this.logger.info('Global command cache has been warmed up.');

    const interactionHandler = this.container.get(InteractionHandlingService);
    interactionHandler.start();

    const eventHandler = this.container.get(EventHandlingService);
    eventHandler.start();

    const discordClient = this.container.get(DiscordClientService);
    const commandPublisher = this.container.get(CommandPublishingService);

    discordClient.getClient().once(Events.ClientReady, async () => {
      await commandPublisher.publish();
    });

    await discordClient.start();
  }
}