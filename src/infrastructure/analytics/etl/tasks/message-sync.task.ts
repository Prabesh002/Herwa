import { DatabaseService } from '@/infrastructure/database/core/database.service';
import { ClickHouseService } from '@/infrastructure/analytics/core/clickhouse.service';
import { messageEvents } from '@/infrastructure/database/schema';
import { isNull, inArray } from 'drizzle-orm';
import { createLogger, Logger } from '@/infrastructure/logging/logger';

export class MessageSyncTask {
  private readonly logger: Logger;

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly clickhouseService: ClickHouseService,
  ) {
    this.logger = createLogger('info').child({ service: 'MessageSyncTask' });
  }

  //TODO for now 1k rows, later will have to see about batching / chunking for larger volumes
  public async run(): Promise<void> {
    const db = this.databaseService.getDb();
    
    const newMessages = await db
      .select()
      .from(messageEvents)
      .where(isNull(messageEvents.chIngestedAt))
      .limit(1000);

    if (newMessages.length === 0) return;

    this.logger.info({ count: newMessages.length }, 'Syncing messages to ClickHouse...');

    try {
      const transformedData = newMessages.map((msg) => ({
        id: msg.id,
        guild_id: msg.guildId,
        channel_id: msg.channelId,
        user_id: msg.userId,
        created_at: msg.createdAt.toISOString().slice(0, 23).replace('T', ' '),
        message_kind: msg.messageKind,
        is_bot: msg.isBot ? 1 : 0,
      }));

      const client = this.clickhouseService.getClient();
      await client.insert({
        table: 'message_events',
        values: transformedData,
        format: 'JSONEachRow',
      });

      const messageIds = newMessages.map(m => m.id);
      await db
        .update(messageEvents)
        .set({ chIngestedAt: new Date() })
        .where(inArray(messageEvents.id, messageIds));

      this.logger.info({ count: newMessages.length }, 'Successfully synced and acknowledged messages.');
    } catch (error) {
      this.logger.error({ error }, 'Failed to sync message events. Rows remain un-ingested in Postgres.');
      throw error;
    }
  }
}