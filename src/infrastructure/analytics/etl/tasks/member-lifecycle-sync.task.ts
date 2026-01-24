import { DatabaseService } from '@/infrastructure/database/core/database.service';
import { ClickHouseService } from '@/infrastructure/analytics/core/clickhouse.service';
import { memberLifecycleEvents } from '@/infrastructure/database/schema';
import { gt } from 'drizzle-orm';
import { createLogger, Logger } from '@/infrastructure/logging/logger';

export class MemberLifecycleSyncTask {
  private readonly logger: Logger;

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly clickhouseService: ClickHouseService,
  ) {
    this.logger = createLogger('info').child({ service: 'MemberLifecycleSyncTask' });
  }

  public async run(): Promise<void> {
    this.logger.info('Starting member lifecycle events sync...');

    try {
      const highWatermark = await this.getHighWatermark();
      this.logger.info({ highWatermark: highWatermark.toISOString() }, 'Retrieved high-watermark from ClickHouse');

      const newEvents = await this.extractNewEvents(highWatermark);

      if (newEvents.length === 0) {
        this.logger.info('No new member lifecycle events to sync');
        return;
      }

      this.logger.info({ count: newEvents.length }, 'Found new member lifecycle events to sync');

      const transformedData = this.transformEvents(newEvents);
      await this.loadToClickHouse(transformedData);

      this.logger.info({ count: newEvents.length }, 'Successfully synced member lifecycle events');
    } catch (error) {
      this.logger.error({ error }, 'Failed to sync member lifecycle events');
      throw error;
    }
  }

  private async getHighWatermark(): Promise<Date> {
    const client = this.clickhouseService.getClient();

    const result = await client.query({
      query: 'SELECT MAX(created_at) as max_timestamp FROM member_lifecycle_events',
      format: 'JSONEachRow',
    });

    const rows = await result.json<{ max_timestamp: string | null }>();

    if (rows.length > 0 && rows[0] && rows[0].max_timestamp) {
      return new Date(rows[0].max_timestamp);
    }

    return new Date(0);
  }

  private async extractNewEvents(since: Date): Promise<typeof memberLifecycleEvents.$inferSelect[]> {
    const db = this.databaseService.getDb();
    const sinceWithBuffer = new Date(since.getTime() + 1);

    return await db
      .select()
      .from(memberLifecycleEvents)
      .where(gt(memberLifecycleEvents.createdAt, sinceWithBuffer));
  }

  private transformEvents(events: typeof memberLifecycleEvents.$inferSelect[]): Array<{
    id: string;
    guild_id: string;
    user_id: string;
    event_type: string;
    created_at: string;
  }> {
    return events.map((event) => ({
      id: event.id,
      guild_id: event.guildId,
      user_id: event.userId,
      event_type: event.eventType,
      created_at: event.createdAt.toISOString().slice(0, 23).replace('T', ' '),
    }));
  }

  private async loadToClickHouse(
    data: Array<{
      id: string;
      guild_id: string;
      user_id: string;
      event_type: string;
      created_at: string;
    }>,
  ): Promise<void> {
    const client = this.clickhouseService.getClient();

    await client.insert({
      table: 'member_lifecycle_events',
      values: data,
      format: 'JSONEachRow',
    });
  }
}
