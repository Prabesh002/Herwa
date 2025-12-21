import 'dotenv/config';
import { AppContainer } from '@/core/app-container';
import { ConfigService } from '@/infrastructure/config/config.service';
import { createLogger } from '@/infrastructure/logging/logger';
import { initializeErrorHandlers } from '@/infrastructure/logging/errorHandler';
import { DiscordClientService } from '@/discord/core/discord-client.service';

async function bootstrap() {
  const container = AppContainer.getInstance();

  const configService = new ConfigService();
  container.register(ConfigService, configService);

  const rootLogger = createLogger(configService.get().logLevel);
  initializeErrorHandlers(rootLogger);
  
  rootLogger.info('Herwa is starting...');
  
  const discordClientService = new DiscordClientService();
  container.register(DiscordClientService, discordClientService);
  
  try {
    await discordClientService.start();
  } catch (error) {
    rootLogger.fatal({ err: error }, 'Failed during application bootstrap');
    process.exit(1);
  }
}

bootstrap();