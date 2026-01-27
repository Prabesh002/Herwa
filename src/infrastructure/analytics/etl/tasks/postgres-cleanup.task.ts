import { DatabaseService } from '@/infrastructure/database/core/database.service';
import { ConfigService } from '@/infrastructure/config/config.service';
import { messageEvents, memberLifecycleEvents, voiceSessions } from '@/infrastructure/database/schema';
import { and, isNotNull, lt } from 'drizzle-orm';
import { createLogger, Logger } from '@/infrastructure/logging/logger';

export class PostgresCleanupTask {
  private readonly logger: Logger;

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly configService: ConfigService
  ) {
    this.logger = createLogger('info').child({ service: 'PostgresCleanup' });
  }

  public async run(): Promise<void> {
    const db = this.databaseService.getDb();
    const retentionHours = this.configService.get().postgresRetentionHours;
    const threshold = new Date(Date.now() - retentionHours * 60 * 60 * 1000);

    this.logger.info({ 
        retentionHours, 
        deletingBefore: threshold.toISOString() 
    }, 'Starting Postgres cleanup cycle.');

    const tables = [
      { name: 'message_events', schema: messageEvents, dateCol: messageEvents.createdAt, ackCol: messageEvents.chIngestedAt },
      { name: 'member_lifecycle_events', schema: memberLifecycleEvents, dateCol: memberLifecycleEvents.createdAt, ackCol: memberLifecycleEvents.chIngestedAt },
      { name: 'voice_sessions', schema: voiceSessions, dateCol: voiceSessions.joinedAt, ackCol: voiceSessions.chIngestedAt },
    ];

    let totalDeleted = 0;

    for (const table of tables) {
      try {
        const deletedRows = await db
          .delete(table.schema)
          .where(
            and(
              isNotNull(table.ackCol),
              lt(table.dateCol, threshold)
            )
          )
          .returning({ id: table.schema.id });
        
        if (deletedRows.length > 0) {
          totalDeleted += deletedRows.length;
          this.logger.info({ table: table.name, count: deletedRows.length }, `Purged acknowledged records.`);
        }
      } catch (error) {
        this.logger.error({ error, table: table.name }, 'Failed to cleanup table.');
      }
    }

    this.logger.info({ totalDeleted }, 'Cleanup cycle finished.');
  }
}