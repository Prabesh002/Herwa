import { AppContainer } from '@/core/app-container';
import { RedisService } from '@/infrastructure/redis/redis.service';
import { resetPeriodEnum } from '@/infrastructure/database/schema/platform/enums.schema';

type ResetPeriod = typeof resetPeriodEnum.enumValues[number];

export class UsageService {
  private redisService = AppContainer.getInstance().get(RedisService);
  
  // 35 Days buffer, keys survive if ETL is down for a while.
  private readonly TTL_BUFFER_SECONDS = 3024000; 

  private getPeriodStart(date: Date, period: ResetPeriod): string {
    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);
    
    if (period === 'MONTHLY') {
      d.setUTCDate(1);
    } else if (period === 'YEARLY') {
      d.setUTCMonth(0, 1);
    }
    
    // Return date part only: YYYY-MM-DD
    return d.toISOString().split('T')[0];
  }

  private getKey(guildId: string, featureId: string, periodStart: string): string {
    return `usage:${guildId}:${featureId}:${periodStart}`;
  }

  public async incrementUsage(
    guildId: string,
    featureId: string,
    period: ResetPeriod,
    amount: number = 1
  ): Promise<number> {
    const now = new Date();
    const periodStart = this.getPeriodStart(now, period);
    const key = this.getKey(guildId, featureId, periodStart);

    const result = await this.redisService.getClient().incrby(key, amount);
    
    if (result === amount) {
      await this.redisService.expire(key, this.TTL_BUFFER_SECONDS);
    }

    return result;
  }

  public async getUsage(
    guildId: string,
    featureId: string,
    period: ResetPeriod
  ): Promise<number> {
    const now = new Date();
    const periodStart = this.getPeriodStart(now, period);
    const key = this.getKey(guildId, featureId, periodStart);

    const val = await this.redisService.get(key);
    return val ? Number(val) : 0;
  }
}