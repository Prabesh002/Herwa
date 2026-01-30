import { AppContainer } from '@/core/app-container';
import { ClickHouseService } from '@/infrastructure/analytics/core/clickhouse.service';
import { ServerStatsData, DailyActivityData } from '@/discord/providers/models/stats.provider.contract';

type CountResult = { 'total': string };
type SumResult = { 'sum_val': string | null };
type DailyResult = { day: string; total: string };

export class StatsRepository {
  private readonly client = AppContainer.getInstance().get(ClickHouseService).getClient();

  private async executeQuery<T>(query: string, params: Record<string, unknown>): Promise<T[]> {
    const resultSet = await this.client.query({
      query,
      query_params: params,
      format: 'JSONEachRow',
    });
    
    const results = await resultSet.json();
    return results as T[];
  }

  public async getServerStats(guildId: string): Promise<ServerStatsData> {
    const [
      messageCountResult,
      joinCountResult,
      leaveCountResult,
      voiceSecondsResult,
    ] = await Promise.all([
      this.executeQuery<CountResult>(
        'SELECT count() as total FROM message_events FINAL WHERE guild_id = {guildId:String}',
        { guildId }
      ),
      this.executeQuery<CountResult>(
        "SELECT count() as total FROM member_lifecycle_events FINAL WHERE guild_id = {guildId:String} AND event_type = 'JOIN'",
        { guildId }
      ),
      this.executeQuery<CountResult>(
        "SELECT count() as total FROM member_lifecycle_events FINAL WHERE guild_id = {guildId:String} AND event_type = 'LEAVE'",
        { guildId }
      ),
      this.executeQuery<SumResult>(
        'SELECT sum(duration_seconds) as sum_val FROM voice_sessions FINAL WHERE guild_id = {guildId:String}',
        { guildId }
      ),
    ]);

    const messageCount = Number(messageCountResult[0]?.total || 0);
    const joinCount = Number(joinCountResult[0]?.total || 0);
    const leaveCount = Number(leaveCountResult[0]?.total || 0);
    const totalVoiceSeconds = Number(voiceSecondsResult[0]?.sum_val || 0);

    return {
      messageCount,
      joinCount,
      leaveCount,
      totalVoiceSeconds,
    };
  }

  public async getDailyMessageActivity(guildId: string, days: number = 7): Promise<DailyActivityData[]> {
    const query = `
      SELECT 
        toDate(day_alias) as day, 
        count() as total 
      FROM (
          SELECT toDate(created_at) as day_alias, id 
          FROM message_events FINAL
          WHERE guild_id = {guildId:String} 
            AND created_at >= subtractDays(now(), {days:Int32})
      ) 
      GROUP BY day 
      ORDER BY day ASC 
      WITH FILL FROM toDate(subtractDays(now(), {days:Int32})) TO toDate(now()) + 1 STEP 1
    `;

    const raw = await this.executeQuery<DailyResult>(query, { guildId, days });
    
    return raw.map(r => ({
      day: new Date(r.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      count: Number(r.total)
    }));
  }
}