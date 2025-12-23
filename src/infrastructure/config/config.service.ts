import 'dotenv/config';
import { AppConfig } from '@/infrastructure/config/config.contract';

export class ConfigService {
  private readonly config: AppConfig;

  constructor() {
    const discordToken = process.env.DISCORD_TOKEN;
    const discordClientId = process.env.DISCORD_CLIENT_ID;
    const discordClientSecret = process.env.DISCORD_CLIENT_SECRET;
    const logLevel = process.env.LOG_LEVEL || 'info';

    if (!discordToken) {
      throw new Error('DISCORD_TOKEN environment variable is not set.');
    }
    if (!discordClientId) {
      throw new Error('DISCORD_CLIENT_ID environment variable is not set.');
    }
    if (!discordClientSecret) {
      throw new Error('DISCORD_CLIENT_SECRET environment variable is not set.');
    }

    this.config = {
      discordToken,
      discordClientId,
      discordClientSecret,
      logLevel,
      databaseUrl: process.env.DATABASE_URL || '',
    };
  }

  public get(): AppConfig {
    return this.config;
  }
}