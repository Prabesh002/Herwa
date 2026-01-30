import { DatabaseService } from '@/infrastructure/database/core/database.service';
import { ClickHouseService } from '@/infrastructure/analytics/core/clickhouse.service';
import { ConfigService } from '@/infrastructure/config/config.service';
import { messageEvents } from '@/infrastructure/database/schema';
import { isNull, inArray, asc } from 'drizzle-orm';
import { createLogger, Logger } from '@/infrastructure/logging/logger';

export class MessageSyncTask {
  private readonly logger: Logger;
  private readonly batchSize: number;

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly clickhouseService: ClickHouseService,
    configService: ConfigService
  ) {
    this.logger = createLogger('info').child({ service: 'MessageSyncTask' });
    this.batchSize = configService.get().analyticsBatchSize;
  }

  public async run(): Promise<void> {
    const db = this.databaseService.getDb();
    const client = this.clickhouseService.getClient();
    let totalSynced = 0;

    while (true) {
      const batch = await db
        .select()
        .from(messageEvents)
        .where(isNull(messageEvents.chIngestedAt))
        .orderBy(asc(messageEvents.id))
        .limit(this.batchSize);

      if (batch.length === 0) break;

      const transformedData = batch.map((msg) => ({
        id: msg.id,
        guild_id: msg.guildId,
        channel_id: msg.channelId,
        user_id: msg.userId,
        created_at: msg.createdAt.toISOString().slice(0, 23).replace('T', ' '),
        message_kind: msg.messageKind,
        is_bot: msg.isBot ? 1 : 0,
      }));

      await client.insert({
        table: 'message_events',
        values: transformedData,
        format: 'JSONEachRow',
      });

      const processedIds = batch.map(m => m.id);
      await db
        .update(messageEvents)
        .set({ chIngestedAt: new Date() })
        .where(inArray(messageEvents.id, processedIds));

      totalSynced += batch.length;
      this.logger.info({ batchSize: batch.length, totalSynced }, 'Processed chunk.');
    }

    if (totalSynced > 0) {
      this.logger.info({ totalSynced }, 'Completed sync cycle.');
    }
  }
}