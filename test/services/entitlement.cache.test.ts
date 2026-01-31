import { describe, test, expect, beforeAll, beforeEach } from 'bun:test';
import { AppContainer } from '@/core/app-container';
import { EntitlementService } from '@/core/services/entitlement.service';
import { EntitlementManager } from '@/core/managers/entitlement.manager';
import { RedisService } from '@/infrastructure/redis/redis.service';
import { TestBootstrap } from '@/test/utils/bootstrap';

describe('Entitlement Caching Logic', () => {
  let entitlementService: EntitlementService;
  let entitlementManager: EntitlementManager;
  let redis: RedisService;
  const guildId = 'cache-test-guild';

  beforeAll(async () => {
    await TestBootstrap.getInstance().initialize();
    const container = AppContainer.getInstance();
    entitlementService = container.get(EntitlementService);
    entitlementManager = container.get(EntitlementManager);
    redis = container.get(RedisService);
  });

  beforeEach(async () => {
    await TestBootstrap.getInstance().cleanupPostgres();
    await TestBootstrap.getInstance().cleanupRedis();
    await entitlementManager.initializeGuild(guildId);
  });

  test('Cache Miss & Populate: Should fetch from DB and store in Redis on first call', async () => {
    const cacheKey = `cache:guild:${guildId}:entitlements`;
    
    const beforeCache = await redis.get(cacheKey);
    expect(beforeCache).toBeNull();

    await entitlementService.getGuildEntitlements(guildId);

    const afterCache = await redis.get(cacheKey);
    expect(afterCache).not.toBeNull();
    
    const parsed = JSON.parse(afterCache!);
    expect(parsed.tierName).toBe('Free');
  });

  test('Cache Invalidation: Should remove Redis key when settings are updated', async () => {
    const cacheKey = `cache:guild:${guildId}:entitlements`;
    
    await entitlementService.getGuildEntitlements(guildId);
    expect(await redis.get(cacheKey)).not.toBeNull();

    await entitlementManager.setGuildTier({ guildId, tierName: 'Pro' });

    expect(await redis.get(cacheKey)).toBeNull();
  });

  test('Global Command Cache: Should warm up and persist across checks', async () => {
    const globalKey = 'cache:global:commands';
    await redis.del(globalKey);

    const commands = await entitlementService.getGlobalCommands();
    expect(commands.has('ping')).toBe(true);

    const cachedRaw = await redis.get(globalKey);
    expect(cachedRaw).not.toBeNull();
  });
});