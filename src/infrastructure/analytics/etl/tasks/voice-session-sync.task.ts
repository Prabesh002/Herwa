import { DatabaseService } from '@/infrastructure/database/core/database.service';
import { ClickHouseService } from '@/infrastructure/analytics/core/clickhouse.service';
import { voiceSessions } from '@/infrastructure/database/schema';
import { isNull, inArray, and, isNotNull } from 'drizzle-orm';
import { createLogger, Logger } from '@/infrastructure/logging/logger';

export class VoiceSessionSyncTask {
  private readonly logger: Logger;

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly clickhouseService: ClickHouseService,
  ) {
    this.logger = createLogger('info').child({ service: 'VoiceSessionSyncTask' });
  }

  //TODO for now 1k rows, later will have to see about batching / chunking for larger volumes
  public async run(): Promise<void> {
    const db = this.databaseService.getDb();
    
    const newSessions = await db
      .select()
      .from(voiceSessions)
      .where(
        and(
          isNull(voiceSessions.chIngestedAt),
          isNotNull(voiceSessions.durationSeconds)
        )
      )
      .limit(1000);

    if (newSessions.length === 0) return;

    this.logger.info({ count: newSessions.length }, 'Syncing voice sessions to ClickHouse...');

    try {
      const transformedData = newSessions.map((session) => ({
        id: session.id,
        guild_id: session.guildId,
        channel_id: session.channelId,
        user_id: session.userId,
        joined_at: session.joinedAt.toISOString().slice(0, 23).replace('T', ' '),
        left_at: session.leftAt!.toISOString().slice(0, 23).replace('T', ' '),
        duration_seconds: session.durationSeconds!,
      }));

      const client = this.clickhouseService.getClient();
      await client.insert({
        table: 'voice_sessions',
        values: transformedData,
        format: 'JSONEachRow',
      });

      const sessionIds = newSessions.map(s => s.id);
      await db
        .update(voiceSessions)
        .set({ chIngestedAt: new Date() })
        .where(inArray(voiceSessions.id, sessionIds));

      this.logger.info({ count: newSessions.length }, 'Successfully synced and acknowledged voice sessions.');
    } catch (error) {
      this.logger.error({ error }, 'Failed to sync voice sessions.');
      throw error;
    }
  }
}
