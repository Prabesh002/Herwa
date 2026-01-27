import 'dotenv/config';
import { AppConfig } from '@/infrastructure/config/config.contract';

export class ConfigService {
  private readonly config: AppConfig;

  constructor() {
    const discordToken = process.env.DISCORD_TOKEN;
    const discordClientId = process.env.DISCORD_CLIENT_ID;
    const discordClientSecret = process.env.DISCORD_CLIENT_SECRET;
    if (!discordToken || !discordClientId || !discordClientSecret) {
      throw new Error('Missing one or more required Discord environment variables.');
    }

    const logLevel = process.env.LOG_LEVEL || 'info';

    const dbHost = process.env.DB_HOST;
    const dbPort = process.env.DB_PORT;
    const dbUser = process.env.DB_USER;
    const dbPassword = process.env.DB_PASSWORD;
    const dbName = process.env.DB_NAME;
    if (!dbHost || !dbPort || !dbUser || !dbPassword || !dbName) {
      throw new Error('Missing one or more required Database environment variables.');
    }
    const databaseUrl = `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;

    const chHost = process.env.CLICKHOUSE_HOST;
    const chPortHttp = process.env.CLICKHOUSE_PORT_HTTP;
    if (!chHost || !chPortHttp) {
      throw new Error('Missing one or more required ClickHouse environment variables.');
    }
    const clickhouseUrl = `http://${chHost}:${chPortHttp}`;

    const rawRetention = process.env.DB_CLEANUP_RETENTION_HOURS;
    const postgresRetentionHours = rawRetention !== undefined ? Number(rawRetention) : 24;

    this.config = {
      discordToken,
      discordClientId,
      discordClientSecret,
      logLevel,
      databaseUrl,
      clickhouseUrl,
      postgresRetentionHours,
    };
  }

  public get(): AppConfig {
    return this.config;
  }
}