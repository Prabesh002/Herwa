import 'dotenv/config';
import { AppContainer } from '@/core/app-container';
import { ConfigService } from '@/infrastructure/config/config.service';
import { DatabaseService } from '@/infrastructure/database/core/database.service';
import { ClickHouseService } from '@/infrastructure/analytics/core/clickhouse.service';
import { MessageSyncTask } from './tasks/message-sync.task';
import { MemberLifecycleSyncTask } from './tasks/member-lifecycle-sync.task';
import { VoiceSessionSyncTask } from './tasks/voice-session-sync.task';
import { PostgresCleanupTask } from './tasks/postgres-cleanup.task';
import { createLogger, Logger } from '@/infrastructure/logging/logger';

async function main(): Promise<void> {
  let logger: Logger | null = null;

  try {
    const container = AppContainer.getInstance();

    const configService = new ConfigService();
    container.register(ConfigService, configService);

    logger = createLogger(configService.get().logLevel).child({ service: 'ETL-Runner' });

    logger.info('Starting ETL batch process...');

    const databaseService = new DatabaseService();
    container.register(DatabaseService, databaseService);

    const clickhouseService = new ClickHouseService();
    container.register(ClickHouseService, clickhouseService);

    logger.info('Connecting to ClickHouse...');
    await clickhouseService.connect();
    logger.info('ClickHouse connection established');

    const messageSyncTask = new MessageSyncTask(databaseService, clickhouseService);
    const memberSyncTask = new MemberLifecycleSyncTask(databaseService, clickhouseService);
    const voiceSyncTask = new VoiceSessionSyncTask(databaseService, clickhouseService);
    const cleanup = new PostgresCleanupTask(databaseService);

    logger.info('Running message events sync task...');
    await messageSyncTask.run();

    logger.info('Running member lifecycle events sync task...');
    await memberSyncTask.run();

    logger.info('Running voice sessions sync task...');
    await voiceSyncTask.run();

    logger.info('ETL batch process completed successfully');
    
    logger.info('Running Postgres cleanup task...');
    await cleanup.run();

    await databaseService.disconnect();
    process.exit(0);
  } catch (error) {
    if (logger) {
      logger.fatal({ error }, 'ETL batch process failed with fatal error');
    } else {
      console.error('ETL batch process failed:', error);
    }
    process.exit(1);
  }
}

main();
