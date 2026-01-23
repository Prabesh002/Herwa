import { DatabaseService } from '@/infrastructure/database/core/database.service';
import { ClickHouseService } from '@/infrastructure/analytics/core/clickhouse.service';
import { messageEvents } from '@/infrastructure/database/schema';
import { gt } from 'drizzle-orm';
import { createLogger, Logger } from '@/infrastructure/logging/logger';

export class MessageSyncTask {
  private readonly logger: Logger;

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly clickhouseService: ClickHouseService,
  ) {
    this.logger = createLogger('info').child({ service: 'MessageSyncTask' });
  }

  public async run(): Promise<void> {
    this.logger.info('Starting message events sync...');

    try {
      const highWatermark = await this.getHighWatermark();
      this.logger.info({ highWatermark }, 'Retrieved high-watermark from ClickHouse');

      const newMessages = await this.extractNewMessages(highWatermark);

      if (newMessages.length === 0) {
        this.logger.info('No new messages to sync');
        return;
      }

      this.logger.info({ count: newMessages.length }, 'Found new messages to sync');

      const transformedData = this.transformMessages(newMessages);
      await this.loadToClickHouse(transformedData);

      this.logger.info({ count: newMessages.length }, 'Successfully synced messages');
    } catch (error) {
      this.logger.error({ error }, 'Failed to sync message events');
      throw error;
    }
  }

  private async getHighWatermark(): Promise<Date> {
    const client = this.clickhouseService.getClient();

    const result = await client.query({
      query: 'SELECT MAX(created_at) as max_timestamp FROM message_events',
      format: 'JSONEachRow',
    });

    const rows = await result.json<{ max_timestamp: string | null }>();

    if (rows.length > 0 && rows[0] && rows[0].max_timestamp) {
      return new Date(rows[0].max_timestamp);
    }

    return new Date(0);
  }

  private async extractNewMessages(since: Date): Promise<typeof messageEvents.$inferSelect[]> {
    const db = this.databaseService.getDb();

    return await db
      .select()
      .from(messageEvents)
      .where(gt(messageEvents.createdAt, since));
  }

  private transformMessages(messages: typeof messageEvents.$inferSelect[]): Array<{
    id: string;
    guild_id: string;
    channel_id: string;
    user_id: string;
    created_at: string;
    message_kind: string;
    is_bot: number;
  }> {
    return messages.map((msg) => ({
      id: msg.id,
      guild_id: msg.guildId,
      channel_id: msg.channelId,
      user_id: msg.userId,
      created_at: msg.createdAt.toISOString().replace('T', ' ').replace('Z', ''),
      message_kind: msg.messageKind,
      is_bot: msg.isBot ? 1 : 0,
    }));
  }

  private async loadToClickHouse(
    data: Array<{
      id: string;
      guild_id: string;
      channel_id: string;
      user_id: string;
      created_at: string;
      message_kind: string;
      is_bot: number;
    }>,
  ): Promise<void> {
    const client = this.clickhouseService.getClient();

    await client.insert({
      table: 'message_events',
      values: data,
      format: 'JSONEachRow',
    });
  }
}
