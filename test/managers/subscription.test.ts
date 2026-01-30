import { describe, test, expect, beforeAll, beforeEach } from 'bun:test';
import { AppContainer } from '@/core/app-container';
import { SubscriptionManager } from '@/core/managers/subscription.manager';
import { EntitlementManager } from '@/core/managers/entitlement.manager';
import { DatabaseService } from '@/infrastructure/database/core/database.service';
import { SubscriptionTierRepository } from '@/infrastructure/database/repositories/platform/catalog/subscription-tier.repository';
import { TestBootstrap } from '@/test/utils/bootstrap';
import { eq } from 'drizzle-orm';
import { guildSettings, guildSubscriptions, payments } from '@/infrastructure/database/schema';

describe('Subscription & Payment Lifecycle', () => {
  let subManager: SubscriptionManager;
  let entitlementManager: EntitlementManager;
  let dbService: DatabaseService;
  let tierRepo: SubscriptionTierRepository;
  const guildId = 'guild-sub-test';

  beforeAll(async () => {
    await TestBootstrap.getInstance().initialize();
    const container = AppContainer.getInstance();
    subManager = container.get(SubscriptionManager);
    entitlementManager = container.get(EntitlementManager);
    dbService = container.get(DatabaseService);
    tierRepo = container.get(SubscriptionTierRepository);
  });

  beforeEach(async () => {
    await TestBootstrap.getInstance().cleanupPostgres();
    await entitlementManager.initializeGuild(guildId);
  });

  test('Subscription Creation: Should record history and be accessible in settings', async () => {
    const pg = dbService.getDb();
    const proTier = await tierRepo.getByName(pg, 'Pro');
    if (!proTier) throw new Error('Pro tier not found');

    const startsAt = new Date();
    const endsAt = new Date();
    endsAt.setMonth(endsAt.getMonth() + 1);

    const subId = await subManager.createSubscription({
      guildId,
      tierId: proTier.id,
      startsAt,
      endsAt,
      status: 'ACTIVE'
    });

    expect(subId).toBeDefined();

    const subRecord = await pg.query.guildSubscriptions.findFirst({
      where: eq(guildSubscriptions.id, subId)
    });

    expect(subRecord).toBeDefined();
    expect(subRecord?.tierId).toBe(proTier.id);
    expect(subRecord?.guildId).toBe(guildId);
  });

  test('Payment Recording: Should link payment to subscription and guild', async () => {
    const pg = dbService.getDb();
    const proTier = await tierRepo.getByName(pg, 'Pro');
    if (!proTier) throw new Error('Pro tier not found');

    const subId = await subManager.createSubscription({
      guildId,
      tierId: proTier.id,
      startsAt: new Date(),
      endsAt: new Date(),
      status: 'ACTIVE'
    });

    const amount = 500;
    const providerTxId = 'txn_test_123';

    await subManager.recordPayment({
      guildId,
      subscriptionId: subId,
      amount,
      provider: 'stripe',
      providerTxId,
      status: 'SUCCESS'
    });

    const paymentRecord = await pg.query.payments.findFirst({
      where: eq(payments.subscriptionId, subId)
    });

    expect(paymentRecord).toBeDefined();
    expect(paymentRecord?.amount).toBe(amount);
    expect(paymentRecord?.providerTxId).toBe(providerTxId);
    expect(paymentRecord?.guildId).toBe(guildId);
  });

  test('Tier Impact: Entitlement Manager should respect updated tier from settings', async () => {
    const pg = dbService.getDb();
    const proTier = await tierRepo.getByName(pg, 'Pro');
    if (!proTier) throw new Error('Pro tier not found');

    const beforeCheck = await entitlementManager.checkEntitlement({
      guildId,
      userId: 'u1',
      commandName: 'server-stats',
      channelId: 'c1',
      memberRoles: []
    });
    expect(beforeCheck.isEntitled).toBe(false);

    await entitlementManager.setGuildTier({ guildId, tierName: 'Pro' });

    const afterCheck = await entitlementManager.checkEntitlement({
      guildId,
      userId: 'u1',
      commandName: 'server-stats',
      channelId: 'c1',
      memberRoles: []
    });
    expect(afterCheck.isEntitled).toBe(true);
  });
});