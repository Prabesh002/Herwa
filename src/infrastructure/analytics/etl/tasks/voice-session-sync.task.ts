import { DatabaseService } from '@/infrastructure/database/core/database.service';
import { ClickHouseService } from '@/infrastructure/analytics/core/clickhouse.service';
import { voiceSessions } from '@/infrastructure/database/schema';
import { gt, isNotNull, and } from 'drizzle-orm';
import { createLogger, Logger } from '@/infrastructure/logging/logger';

export class VoiceSessionSyncTask {
  private readonly logger: Logger;

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly clickhouseService: ClickHouseService,
  ) {
    this.logger = createLogger('info').child({ service: 'VoiceSessionSyncTask' });
  }

  public async run(): Promise<void> {
    this.logger.info('Starting voice sessions sync...');

    try {
      const highWatermark = await this.getHighWatermark();
      this.logger.info({ highWatermark: highWatermark.toISOString() }, 'Retrieved high-watermark from ClickHouse');

      const newSessions = await this.extractNewSessions(highWatermark);

      if (newSessions.length === 0) {
        this.logger.info('No new voice sessions to sync');
        return;
      }

      this.logger.info({ count: newSessions.length }, 'Found new voice sessions to sync');

      const transformedData = this.transformSessions(newSessions);
      await this.loadToClickHouse(transformedData);

      this.logger.info({ count: newSessions.length }, 'Successfully synced voice sessions');
    } catch (error) {
      this.logger.error({ error }, 'Failed to sync voice sessions');
      throw error;
    }
  }

  private async getHighWatermark(): Promise<Date> {
    const client = this.clickhouseService.getClient();

    const result = await client.query({
      query: 'SELECT MAX(joined_at) as max_timestamp FROM voice_sessions',
      format: 'JSONEachRow',
    });

    const rows = await result.json<{ max_timestamp: string | null }>();

    if (rows.length > 0 && rows[0] && rows[0].max_timestamp) {
      return new Date(rows[0].max_timestamp);
    }

    return new Date(0);
  }

  private async extractNewSessions(since: Date): Promise<typeof voiceSessions.$inferSelect[]> {
    const db = this.databaseService.getDb();
    const sinceWithBuffer = new Date(since.getTime() + 1);

    return await db
      .select()
      .from(voiceSessions)
      .where(and(gt(voiceSessions.joinedAt, sinceWithBuffer), isNotNull(voiceSessions.durationSeconds)));
  }

  private transformSessions(sessions: typeof voiceSessions.$inferSelect[]): Array<{
    id: string;
    guild_id: string;
    channel_id: string;
    user_id: string;
    joined_at: string;
    left_at: string;
    duration_seconds: number;
  }> {
    return sessions.map((session) => ({
      id: session.id,
      guild_id: session.guildId,
      channel_id: session.channelId,
      user_id: session.userId,
      joined_at: session.joinedAt.toISOString().slice(0, 23).replace('T', ' '),
      left_at: session.leftAt!.toISOString().slice(0, 23).replace('T', ' '),
      duration_seconds: session.durationSeconds!,
    }));
  }

  private async loadToClickHouse(
    data: Array<{
      id: string;
      guild_id: string;
      channel_id: string;
      user_id: string;
      joined_at: string;
      left_at: string;
      duration_seconds: number;
    }>,
  ): Promise<void> {
    const client = this.clickhouseService.getClient();

    await client.insert({
      table: 'voice_sessions',
      values: data,
      format: 'JSONEachRow',
    });
  }
}
