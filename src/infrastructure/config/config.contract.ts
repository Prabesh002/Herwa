export interface AppConfig {
  discordToken: string;
  discordClientId: string;
  discordClientSecret: string;
  logLevel: string;
  databaseUrl: string;
  clickhouseUrl: string;
  redisHost: string;
  redisPort: number;
  redisPassword?: string;
  postgresRetentionHours: number;
  analyticsBatchSize: number;
}