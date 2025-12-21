import 'dotenv/config';
import { AppConfig } from '@/infrastructure/config/config.contract';

export class ConfigService {
  private readonly config: AppConfig;

  constructor() {
    const discordToken = process.env.DISCORD_TOKEN;
    const logLevel = process.env.LOG_LEVEL || 'info';

    if (!discordToken) {
      throw new Error('DISCORD_TOKEN environment variable is not set.');
    }

    this.config = {
      discordToken,
      logLevel,
    };
  }

  public get(): AppConfig {
    return this.config;
  }
}