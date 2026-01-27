import { DatabaseService } from '@/infrastructure/database/core/database.service';
import { messageEvents, memberLifecycleEvents, voiceSessions } from '@/infrastructure/database/schema';
import { and, isNotNull, lt, sql } from 'drizzle-orm';
import { createLogger, Logger } from '@/infrastructure/logging/logger';

export class PostgresCleanupTask {
  private readonly logger: Logger;

  constructor(private readonly databaseService: DatabaseService) {
    this.logger = createLogger('info').child({ service: 'PostgresCleanup' });
  }

  public async run(): Promise<void> {
    this.logger.info('Starting Postgres cleanup of ingested data...');
    const db = this.databaseService.getDb();

    const threshold = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const tables = [
      { name: 'message_events', schema: messageEvents, dateCol: messageEvents.createdAt, ackCol: messageEvents.chIngestedAt },
      { name: 'member_lifecycle_events', schema: memberLifecycleEvents, dateCol: memberLifecycleEvents.createdAt, ackCol: memberLifecycleEvents.chIngestedAt },
      { name: 'voice_sessions', schema: voiceSessions, dateCol: voiceSessions.joinedAt, ackCol: voiceSessions.chIngestedAt },
    ];

    for (const table of tables) {
      try {
        const result = await db
          .delete(table.schema)
          .where(
            and(
              isNotNull(table.ackCol),
              lt(table.dateCol, threshold) 
            )
          );
        
        this.logger.info({ table: table.name }, `Purged old ingested rows.`);
      } catch (error) {
        this.logger.error({ error, table: table.name }, 'Failed to cleanup table.');
      }
    }
  }
}