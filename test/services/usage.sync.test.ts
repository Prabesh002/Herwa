import { describe, test, expect, beforeAll, beforeEach } from 'bun:test';
import { AppContainer } from '@/core/app-container';
import { UsageService } from '@/core/services/usage.service';
import { UsageSyncTask } from '@/infrastructure/analytics/etl/tasks/usage-sync.task';
import { DatabaseService } from '@/infrastructure/database/core/database.service';
import { EntitlementManager } from '@/core/managers/entitlement.manager';
import { TestBootstrap } from '@/test/utils/bootstrap';
import { RedisService } from '@/infrastructure/redis/redis.service';

describe('Usage Cache & Sync Logic', () => {
  let usageService: UsageService;
  let syncTask: UsageSyncTask;
  let db: DatabaseService;
  let redis: RedisService;
  let entitlementManager: EntitlementManager;
  const guildId = 'usage-sync-guild';
  let featureId: string;

  beforeAll(async () => {
    await TestBootstrap.getInstance().initialize();
    const container = AppContainer.getInstance();
    usageService = container.get(UsageService);
    db = container.get(DatabaseService);
    redis = container.get(RedisService);
    entitlementManager = container.get(EntitlementManager);
    syncTask = new UsageSyncTask();

    const statsFeature = await db.getDb().query.systemFeatures.findFirst({
      where: (f, { eq }) => eq(f.code, 'STATS')
    });
    if (!statsFeature) throw new Error('Seeded STATS feature not found');
    featureId = statsFeature.id;
  });

  beforeEach(async () => {
    await TestBootstrap.getInstance().cleanupPostgres();
    await TestBootstrap.getInstance().cleanupRedis();
    await entitlementManager.initializeGuild(guildId);
  });

  test('Write-Behind Sync: Should move counts from Redis to Postgres and decrement Redis', async () => {
    const incrementAmount = 5;
    await usageService.incrementUsage(guildId, featureId, 'MONTHLY', incrementAmount);

    const redisVal = await usageService.getUsage(guildId, featureId, 'MONTHLY');
    expect(redisVal).toBe(incrementAmount);

    await syncTask.run();

    const pgRow = await db.getDb().query.guildFeatureUsage.findFirst({
      where: (u, { eq }) => eq(u.guildId, guildId),
    });
    expect(pgRow?.usageCount).toBe(incrementAmount);

    const redisPostSync = await usageService.getUsage(guildId, featureId, 'MONTHLY');
    expect(redisPostSync).toBe(0);
  });

  test('Concurrency Safety: Total usage should be conserved during active increments', async () => {
    const redisClient = redis.getClient();
    const now = new Date();
    const d = new Date(now);
    d.setUTCHours(0, 0, 0, 0);
    d.setUTCDate(1); 
    const periodStart = d.toISOString().split('T')[0];
    const key = `usage:${guildId}:${featureId}:${periodStart}`;

    await redisClient.set(key, '10');

    const syncPromise = syncTask.run();
    await redisClient.incr(key); 
    await syncPromise;

    const pgRow = await db.getDb().query.guildFeatureUsage.findFirst({
      where: (u, { eq }) => eq(u.guildId, guildId),
    });
    const dbCount = pgRow?.usageCount || 0;
    
    const redisPostSync = await redisClient.get(key);
    const redisCount = Number(redisPostSync);

    expect(dbCount + redisCount).toBe(11);
  });
});