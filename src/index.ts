import { Client, Events, GatewayIntentBits } from 'discord.js';
import { ConfigService } from '@/infrastructure/config/config.service';
import {
  createLogger,
  Logger,
} from '@/infrastructure/logging/logger';
import { initializeErrorHandlers } from '@/infrastructure/logging/errorHandler';

const configService = new ConfigService();
const config = configService.get();
const logger: Logger = createLogger(config.logLevel);
initializeErrorHandlers(logger);

async function start() {
  logger.info('Herwa is starting...');

  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
  });

  client.once(Events.ClientReady, (readyClient) => {
    logger.info(`Ready! Logged in as ${readyClient.user.tag}`);
  });

  try {
    await client.login(config.discordToken);
  } catch (error) {
    logger.fatal({ err: error }, 'Failed to login to Discord');
    process.exit(1);
  }
}

start();