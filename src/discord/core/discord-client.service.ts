import { Client, Events, GatewayIntentBits } from 'discord.js';
import { AppContainer } from '@/core/app-container';
import { ConfigService } from '@/infrastructure/config/config.service';
import { Logger } from '@/infrastructure/logging/logger';
import { createLogger } from '@/infrastructure/logging/logger';

export class DiscordClientService {
  private readonly client: Client;
  private readonly logger: Logger;
  private readonly configService: ConfigService;

  constructor() {
    this.configService = AppContainer.getInstance().get(ConfigService);
    const config = this.configService.get();
    
    this.logger = createLogger(config.logLevel).child({ service: 'DiscordClient' });

    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent,
      ],
    });
  }

  public async start(): Promise<void> {
    this.logger.info('Starting Discord client...');

    this.client.once(Events.ClientReady, (readyClient) => {
      this.logger.info(`Ready! Logged in as ${readyClient.user.tag}`);
    });

    try {
      const token = this.configService.get().discordToken;
      await this.client.login(token);
    } catch (error) {
      this.logger.fatal({ err: error }, 'Failed to login to Discord');
      process.exit(1);
    }
  }

  public getClient(): Client {
    return this.client;
  }
}