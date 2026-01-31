import { AppContainer } from '@/core/app-container';
import { RedisService } from '@/infrastructure/redis/redis.service';
import { DatabaseService } from '@/infrastructure/database/core/database.service';
import { GuildFeatureUsagePersistenceService } from '@/infrastructure/database/services/platform/entitlement/guild-feature-usage.persistence.service';
import { createLogger, Logger } from '@/infrastructure/logging/logger';
import { endOfMonth } from 'date-fns';

export class UsageSyncTask {
  private readonly logger: Logger;
  private redis: RedisService;
  private db: DatabaseService;
  private usagePersistence: GuildFeatureUsagePersistenceService;
  private readonly scanCount = 100;

  constructor() {
    this.logger = createLogger('info').child({ service: 'UsageSyncTask' });
    this.redis = AppContainer.getInstance().get(RedisService);
    this.db = AppContainer.getInstance().get(DatabaseService);
    this.usagePersistence = AppContainer.getInstance().get(GuildFeatureUsagePersistenceService);
  }

  public async run(): Promise<void> {
    const redisClient = this.redis.getClient();
    let cursor = '0';
    let totalSynced = 0;

    do {
      const [nextCursor, keys] = await redisClient.scan(cursor, 'MATCH', 'usage:*', 'COUNT', this.scanCount);
      cursor = nextCursor;

      if (keys.length === 0) continue;

      const pipeline = redisClient.pipeline();
      for (const key of keys) {
        pipeline.get(key);
      }
      const counts = await pipeline.exec();
      if (!counts) continue;

      const updates: { key: string, count: number }[] = [];
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const countResult = counts[i];
        if (countResult[0] === null && countResult[1] !== null) {
          const count = Number(countResult[1]);
          if (count > 0) {
            updates.push({ key, count });
          }
        }
      }

      if (updates.length > 0) {
        await this.db.getDb().transaction(async (tx) => {
          for (const { key, count } of updates) {
            const [, guildId, featureId, periodStartStr] = key.split(':');
            if (!guildId || !featureId || !periodStartStr) continue;

            const periodStart = new Date(periodStartStr);
            const periodEnd = endOfMonth(periodStart);

            await this.usagePersistence.upsert(tx, {
              guildId,
              featureId,
              periodStart,
              periodEnd,
              usageCount: count,
            });
          }
        });

        const resetPipeline = redisClient.pipeline();
        for (const { key, count } of updates) {
          resetPipeline.decrby(key, count);
        }
        await resetPipeline.exec();
        totalSynced += updates.length;
      }

    } while (cursor !== '0');

    if (totalSynced > 0) {
      this.logger.info({ keysSynced: totalSynced }, 'Completed usage sync cycle.');
    }
  }
}