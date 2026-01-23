import { createClient } from '@clickhouse/client';
import { AppContainer } from '@/core/app-container';
import { ConfigService } from '@/infrastructure/config/config.service';
import { createLogger, Logger } from '@/infrastructure/logging/logger';
import { AnalyticsClient } from './clickhouse.contract';

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class ClickHouseService {
  private readonly client: AnalyticsClient;
  private readonly logger: Logger;

  constructor() {
    const configService = AppContainer.getInstance().get(ConfigService);
    const config = configService.get();
    this.logger = createLogger(config.logLevel).child({
      service: 'ClickHouse',
    });

    this.client = createClient({
      url: config.clickhouseUrl,
      username: process.env.CLICKHOUSE_USER,
      password: process.env.CLICKHOUSE_PASSWORD,
      database: process.env.CLICKHOUSE_DB,
    });
  }

  public async connect(): Promise<void> {
    this.logger.info('Attempting to connect to ClickHouse...');

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await this.client.ping();
        if (response.success) {
          this.logger.info('Successfully connected to ClickHouse.');
          return;
        }
      } catch (error) {
        // Ignore connection errors during retries
      }

      if (attempt < MAX_RETRIES) {
        this.logger.warn(
          `Connection attempt ${attempt} failed. Retrying in ${RETRY_DELAY_MS / 1000}s...`,
        );
        await delay(RETRY_DELAY_MS);
      }
    }

    this.logger.fatal(`Could not connect to ClickHouse after ${MAX_RETRIES} attempts.`);
    throw new Error('Failed to establish connection to ClickHouse.');
  }

  public getClient(): AnalyticsClient {
    return this.client;
  }
}