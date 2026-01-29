import { DatabaseService } from '@/infrastructure/database/core/database.service';
import { ClickHouseService } from '@/infrastructure/analytics/core/clickhouse.service';
import { ConfigService } from '@/infrastructure/config/config.service';
import { memberLifecycleEvents } from '@/infrastructure/database/schema';
import { isNull, inArray, asc } from 'drizzle-orm';
import { createLogger, Logger } from '@/infrastructure/logging/logger';

export class MemberLifecycleSyncTask {
  private readonly logger: Logger;
  private readonly batchSize: number;

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly clickhouseService: ClickHouseService,
    configService: ConfigService
  ) {
    this.logger = createLogger('info').child({ service: 'MemberLifecycleSyncTask' });
    this.batchSize = configService.get().analyticsBatchSize;
  }

  public async run(): Promise<void> {
    const db = this.databaseService.getDb();
    const client = this.clickhouseService.getClient();
    let totalSynced = 0;

    while (true) {
      const batch = await db
        .select()
        .from(memberLifecycleEvents)
        .where(isNull(memberLifecycleEvents.chIngestedAt))
        .orderBy(asc(memberLifecycleEvents.id))
        .limit(this.batchSize);

      if (batch.length === 0) break;

      const transformedData = batch.map((event) => ({
        id: event.id,
        guild_id: event.guildId,
        user_id: event.userId,
        event_type: event.eventType,
        created_at: event.createdAt.toISOString().slice(0, 23).replace('T', ' '),
      }));

      await client.insert({
        table: 'member_lifecycle_events',
        values: transformedData,
        format: 'JSONEachRow',
      });

      const processedIds = batch.map(e => e.id);
      await db
        .update(memberLifecycleEvents)
        .set({ chIngestedAt: new Date() })
        .where(inArray(memberLifecycleEvents.id, processedIds));

      totalSynced += batch.length;
      this.logger.info({ batchSize: batch.length, totalSynced }, 'Processed chunk.');
    }

    if (totalSynced > 0) {
      this.logger.info({ totalSynced }, 'Completed sync cycle.');
    }
  }
}
