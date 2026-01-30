import { describe, test, expect, beforeAll, beforeEach } from 'bun:test';
import { AppContainer } from '@/core/app-container';
import { EntitlementManager } from '@/core/managers/entitlement.manager';
import { DatabaseService } from '@/infrastructure/database/core/database.service';
import { TestBootstrap } from '@/test/utils/bootstrap';
import { EntitlementDenialReason } from '@/core/dtos/results.dtos';
import { guildSettings } from '@/infrastructure/database/schema';

describe('Entitlement Manager Logic', () => {
  let entitlementManager: EntitlementManager;
  let dbService: DatabaseService;
  const guildId = 'test-guild-entitlement';
  const defaultCheck = {
    guildId,
    userId: 'user-1',
    channelId: 'channel-1',
    memberRoles: ['role-everyone'],
  };

  beforeAll(async () => {
    await TestBootstrap.getInstance().initialize();
    const container = AppContainer.getInstance();
    entitlementManager = container.get(EntitlementManager);
    dbService = container.get(DatabaseService);
  });

  beforeEach(async () => {
    await TestBootstrap.getInstance().cleanupPostgres();
    await entitlementManager.initializeGuild(guildId);
  });

  test('Happy Path: Should allow command on Free tier', async () => {
    const result = await entitlementManager.checkEntitlement({
      ...defaultCheck,
      commandName: 'ping',
    });
    expect(result.isEntitled).toBe(true);
  });

  test('Tier Restriction: Should deny command not on Free tier', async () => {
    const result = await entitlementManager.checkEntitlement({
      ...defaultCheck,
      commandName: 'server-stats',
    });
    expect(result.isEntitled).toBe(false);
    expect(result.reasonCode).toBe(EntitlementDenialReason.TIER_MISSING_FEATURE);
  });

  test('Tier Upgrade: Should allow command after tier change', async () => {
    await entitlementManager.setGuildTier({ guildId, tierName: 'Pro' });
    const result = await entitlementManager.checkEntitlement({
      ...defaultCheck,
      commandName: 'server-stats',
    });
    expect(result.isEntitled).toBe(true);
  });

  test('Admin Override: Should deny command if feature is disabled', async () => {
    await entitlementManager.setGuildTier({ guildId, tierName: 'Pro' });
    await entitlementManager.toggleFeature({ guildId, featureCode: 'STATS', isEnabled: false });

    const result = await entitlementManager.checkEntitlement({
      ...defaultCheck,
      commandName: 'server-stats',
    });
    expect(result.isEntitled).toBe(false);
    expect(result.reasonCode).toBe(EntitlementDenialReason.FEATURE_DISABLED_BY_ADMIN);
  });
  
  test('Role Permissions: Should deny if user has a denied role', async () => {
    await entitlementManager.setCommandPermissions({
      guildId,
      commandName: 'ping',
      denyRoleIds: ['role-denied'],
    });
    const result = await entitlementManager.checkEntitlement({
      ...defaultCheck,
      commandName: 'ping',
      memberRoles: ['role-everyone', 'role-denied'],
    });
    expect(result.isEntitled).toBe(false);
    expect(result.reasonCode).toBe(EntitlementDenialReason.ROLE_DENIED);
  });

  test('Role Permissions: Should deny if user is missing an allowed role', async () => {
    await entitlementManager.setCommandPermissions({
      guildId,
      commandName: 'ping',
      allowedRoleIds: ['role-allowed'],
    });
    const result = await entitlementManager.checkEntitlement({
      ...defaultCheck,
      commandName: 'ping',
      memberRoles: ['role-everyone'],
    });
    expect(result.isEntitled).toBe(false);
    expect(result.reasonCode).toBe(EntitlementDenialReason.MISSING_ROLE);
  });

  test('Channel Permissions: Should deny if used in wrong channel', async () => {
    await entitlementManager.setCommandPermissions({
      guildId,
      commandName: 'ping',
      allowedChannelIds: ['channel-allowed'],
    });
    const result = await entitlementManager.checkEntitlement({
      ...defaultCheck,
      commandName: 'ping',
      channelId: 'channel-wrong',
    });
    expect(result.isEntitled).toBe(false);
    expect(result.reasonCode).toBe(EntitlementDenialReason.INVALID_CHANNEL);
  });

  test('Lazy Initialization: Should create settings for a new guild on first check', async () => {
    const newGuildId = 'new-unseen-guild';
    
    let guildRow = await dbService.getDb().query.guildSettings.findFirst({ where: (g, { eq }) => eq(g.guildId, newGuildId) });
    expect(guildRow).toBeUndefined();

    const result = await entitlementManager.checkEntitlement({
      ...defaultCheck,
      guildId: newGuildId,
      commandName: 'ping',
    });
    
    expect(result.isEntitled).toBe(true);

    guildRow = await dbService.getDb().query.guildSettings.findFirst({ where: (g, { eq }) => eq(g.guildId, newGuildId) });
    expect(guildRow).toBeDefined();
    expect(guildRow?.guildId).toBe(newGuildId);
  });
});