import { DatabaseService } from '@/infrastructure/database/core/database.service';
import { ClickHouseService } from '@/infrastructure/analytics/core/clickhouse.service';
import { ConfigService } from '@/infrastructure/config/config.service';
import { voiceSessions } from '@/infrastructure/database/schema';
import { isNull, inArray, and, isNotNull, asc } from 'drizzle-orm';
import { createLogger, Logger } from '@/infrastructure/logging/logger';

export class VoiceSessionSyncTask {
  private readonly logger: Logger;
  private readonly batchSize: number;

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly clickhouseService: ClickHouseService,
    configService: ConfigService
  ) {
    this.logger = createLogger('info').child({ service: 'VoiceSessionSyncTask' });
    this.batchSize = configService.get().analyticsBatchSize;
  }

  public async run(): Promise<void> {
    const db = this.databaseService.getDb();
    const client = this.clickhouseService.getClient();
    let totalSynced = 0;

    while (true) {
      const batch = await db
        .select()
        .from(voiceSessions)
        .where(
          and(
            isNull(voiceSessions.chIngestedAt),
            isNotNull(voiceSessions.durationSeconds)
          )
        )
        .orderBy(asc(voiceSessions.id))
        .limit(this.batchSize);

      if (batch.length === 0) break;

      const transformedData = batch.map((session) => ({
        id: session.id,
        guild_id: session.guildId,
        channel_id: session.channelId,
        user_id: session.userId,
        joined_at: session.joinedAt.toISOString().slice(0, 23).replace('T', ' '),
        left_at: session.leftAt!.toISOString().slice(0, 23).replace('T', ' '),
        duration_seconds: session.durationSeconds!,
      }));

      await client.insert({
        table: 'voice_sessions',
        values: transformedData,
        format: 'JSONEachRow',
      });

      const processedIds = batch.map(s => s.id);
      await db
        .update(voiceSessions)
        .set({ chIngestedAt: new Date() })
        .where(inArray(voiceSessions.id, processedIds));

      totalSynced += batch.length;
      this.logger.info({ batchSize: batch.length, totalSynced }, 'Processed chunk.');
    }

    if (totalSynced > 0) {
      this.logger.info({ totalSynced }, 'Completed sync cycle.');
    }
  }
}
