import { AppContainer } from '@/core/app-container';
import { ClickHouseService } from '@/infrastructure/analytics/core/clickhouse.service';
import { ServerStatsData, DailyActivityData } from '@/discord/providers/models/stats.provider.contract';

type CountResult = { 'COUNT()': string };
type SumResult = { 'sum(duration_seconds)': string | null };
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
        'SELECT COUNT() FROM message_events WHERE guild_id = {guildId:String}',
        { guildId }
      ),
      this.executeQuery<CountResult>(
        "SELECT COUNT() FROM member_lifecycle_events WHERE guild_id = {guildId:String} AND event_type = 'JOIN'",
        { guildId }
      ),
      this.executeQuery<CountResult>(
        "SELECT COUNT() FROM member_lifecycle_events WHERE guild_id = {guildId:String} AND event_type = 'LEAVE'",
        { guildId }
      ),
      this.executeQuery<SumResult>(
        'SELECT sum(duration_seconds) FROM voice_sessions WHERE guild_id = {guildId:String}',
        { guildId }
      ),
    ]);

    const messageCount = Number(messageCountResult[0]?.['COUNT()'] || 0);
    const joinCount = Number(joinCountResult[0]?.['COUNT()'] || 0);
    const leaveCount = Number(leaveCountResult[0]?.['COUNT()'] || 0);
    const totalVoiceSeconds = Number(voiceSecondsResult[0]?.['sum(duration_seconds)'] || 0);

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
        toDate(created_at) as day, 
        count() as total 
      FROM message_events 
      WHERE guild_id = {guildId:String} 
        AND created_at >= subtractDays(now(), {days:Int32})
      GROUP BY day 
      ORDER BY day ASC
    `;

    const raw = await this.executeQuery<DailyResult>(query, { guildId, days });
    
    return raw.map(r => ({
      day: r.day,
      count: Number(r.total)
    }));
  }
}