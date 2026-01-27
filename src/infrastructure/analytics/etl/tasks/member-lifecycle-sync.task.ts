import { DatabaseService } from '@/infrastructure/database/core/database.service';
import { ClickHouseService } from '@/infrastructure/analytics/core/clickhouse.service';
import { memberLifecycleEvents } from '@/infrastructure/database/schema';
import { isNull, inArray } from 'drizzle-orm';
import { createLogger, Logger } from '@/infrastructure/logging/logger';

export class MemberLifecycleSyncTask {
  private readonly logger: Logger;

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly clickhouseService: ClickHouseService,
  ) {
    this.logger = createLogger('info').child({ service: 'MemberLifecycleSyncTask' });
  }

  //TODO for now 1k rows, later will have to see about batching / chunking for larger volumes
  public async run(): Promise<void> {
    const db = this.databaseService.getDb();
    
    const newEvents = await db
      .select()
      .from(memberLifecycleEvents)
      .where(isNull(memberLifecycleEvents.chIngestedAt))
      .limit(1000);

    if (newEvents.length === 0) return;

    this.logger.info({ count: newEvents.length }, 'Syncing member events to ClickHouse...');

    try {
      const transformedData = newEvents.map((event) => ({
        id: event.id,
        guild_id: event.guildId,
        user_id: event.userId,
        event_type: event.eventType,
        created_at: event.createdAt.toISOString().slice(0, 23).replace('T', ' '),
      }));

      const client = this.clickhouseService.getClient();
      await client.insert({
        table: 'member_lifecycle_events',
        values: transformedData,
        format: 'JSONEachRow',
      });

      const eventIds = newEvents.map(e => e.id);
      await db
        .update(memberLifecycleEvents)
        .set({ chIngestedAt: new Date() })
        .where(inArray(memberLifecycleEvents.id, eventIds));

      this.logger.info({ count: newEvents.length }, 'Successfully synced and acknowledged member events.');
    } catch (error) {
      this.logger.error({ error }, 'Failed to sync member lifecycle events.');
      throw error;
    }
  }
}
