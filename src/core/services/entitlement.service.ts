import { AppContainer } from '@/core/app-container';
import { RedisService } from '@/infrastructure/redis/redis.service';
import { DatabaseService } from '@/infrastructure/database/core/database.service';
import { GuildSettingsRepository } from '@/infrastructure/database/repositories/platform/entitlement/guild-settings.repository';
import { SystemCommandRepository } from '@/infrastructure/database/repositories/platform/catalog/system-command.repository';
import { SubscriptionTierRepository } from '@/infrastructure/database/repositories/platform/catalog/subscription-tier.repository';
import { SystemFeatureRepository } from '@/infrastructure/database/repositories/platform/catalog/system-feature.repository';
import { GuildSettingsPersistenceService } from '@/infrastructure/database/services/platform/entitlement/guild-settings.persistence.service';
import { GuildFeatureOverridePersistenceService } from '@/infrastructure/database/services/platform/entitlement/guild-feature-override.persistence.service';
import { GuildCommandPermissionPersistenceService } from '@/infrastructure/database/services/platform/entitlement/guild-command-permission.persistence.service';
import { CachedCommand, CachedGuildEntitlements, CachedFeatureQuota } from '@/core/dtos/cache.dtos';
import { ChangeGuildTierDto, SetCommandPermissionDto, ToggleGuildFeatureDto } from '@/core/dtos/manager.dtos';

const GLOBAL_COMMANDS_KEY = 'cache:global:commands';
const GUILD_ENTITLEMENT_KEY = (guildId: string) => `cache:guild:${guildId}:entitlements`;
const CACHE_TTL_SECONDS = 60 * 60 * 24; // 24 hours

export class EntitlementService {
  private redis = AppContainer.getInstance().get(RedisService);
  private db = AppContainer.getInstance().get(DatabaseService);

  private guildSettingsRepo = AppContainer.getInstance().get(GuildSettingsRepository);
  private commandRepo = AppContainer.getInstance().get(SystemCommandRepository);
  private tierRepo = AppContainer.getInstance().get(SubscriptionTierRepository);
  private featureRepo = AppContainer.getInstance().get(SystemFeatureRepository);

  private guildSettingsService = AppContainer.getInstance().get(GuildSettingsPersistenceService);
  private overrideService = AppContainer.getInstance().get(GuildFeatureOverridePersistenceService);
  private permService = AppContainer.getInstance().get(GuildCommandPermissionPersistenceService);

  public async getGlobalCommands(): Promise<Map<string, CachedCommand>> {
    const cached = await this.redis.get(GLOBAL_COMMANDS_KEY);
    if (cached) {
      return new Map(JSON.parse(cached));
    }
    return this.warmupGlobalCommands();
  }

  public async warmupGlobalCommands(): Promise<Map<string, CachedCommand>> {
    const allCommands = await this.db.getDb().query.systemCommands.findMany({
      with: { feature: true },
    });

    const commandMap = new Map<string, CachedCommand>();
    for (const cmd of allCommands) {
      commandMap.set(cmd.discordCommandName, {
        featureId: cmd.featureId,
        featureCode: cmd.feature.code,
        isMaintenance: cmd.isMaintenance,
        isGlobalEnabled: cmd.feature.isGlobalEnabled,
      });
    }

    await this.redis.set(GLOBAL_COMMANDS_KEY, JSON.stringify(Array.from(commandMap.entries())));
    return commandMap;
  }

  public async getGuildEntitlements(guildId: string): Promise<CachedGuildEntitlements | null> {
    const key = GUILD_ENTITLEMENT_KEY(guildId);
    const cached = await this.redis.get(key);
    
    if (cached) {
      const parsed = JSON.parse(cached);
      return {
        ...parsed,
        tierFeatures: new Map<string, CachedFeatureQuota>(parsed.tierFeatures),
        disabledFeatures: new Set(parsed.disabledFeatures),
        commandPermissions: new Map(parsed.commandPermissions),
      };
    }

    return this.fetchAndCacheGuildSettings(guildId);
  }

  public async invalidateGuildCache(guildId: string): Promise<void> {
    await this.redis.del(GUILD_ENTITLEMENT_KEY(guildId));
  }

  private async fetchAndCacheGuildSettings(guildId: string): Promise<CachedGuildEntitlements | null> {
    const db = this.db.getDb();
    const settings = await db.query.guildSettings.findFirst({
      where: (g, { eq }) => eq(g.guildId, guildId),
      with: { tier: true, overrides: true, permissions: true },
    });

    if (!settings) return null;

    const tierFeaturesResult = await db.query.tierFeatures.findMany({
      where: (tf, { eq }) => eq(tf.tierId, settings.tierId),
      with: { feature: true },
    });

    const tierFeatures = new Map<string, CachedFeatureQuota>();
    for (const tf of tierFeaturesResult) {
      tierFeatures.set(tf.feature.code, {
        limit: tf.usageLimit,
        resetPeriod: tf.resetPeriod,
      });
    }

    const disabledFeatures = new Set(
      settings.overrides.filter(o => !o.isEnabled).map(o => o.featureId)
    );
    
    const commandPermissions = new Map();
    for(const p of settings.permissions) {
      commandPermissions.set(p.commandName, {
        allowedRoleIds: p.allowedRoleIds,
        allowedChannelIds: p.allowedChannelIds,
        denyRoleIds: p.denyRoleIds,
      });
    }

    const cachedObject: CachedGuildEntitlements = {
      tierId: settings.tierId,
      tierName: settings.tier.name,
      subscriptionExpiresAt: settings.subscriptionExpiresAt,
      tierFeatures,
      disabledFeatures,
      commandPermissions,
    };
    
    const replacer = (key: string, value: any) => {
      if (value instanceof Set) return Array.from(value);
      if (value instanceof Map) return Array.from(value.entries());
      return value;
    };

    await this.redis.set(
      GUILD_ENTITLEMENT_KEY(guildId),
      JSON.stringify(cachedObject, replacer),
      CACHE_TTL_SECONDS
    );

    return cachedObject;
  }

  public async setGuildTier(dto: ChangeGuildTierDto): Promise<void> {
    await this.db.getDb().transaction(async (tx) => {
      const tier = await this.tierRepo.getByName(tx, dto.tierName);
      if (!tier) throw new Error(`Tier '${dto.tierName}' not found.`);

      const settings = await this.guildSettingsRepo.getByGuildId(tx, dto.guildId);
      if (!settings) {
         await this.guildSettingsService.create(tx, {
           guildId: dto.guildId,
           tierId: tier.id
         });
      } else {
         await this.guildSettingsService.updateTier(tx, dto.guildId, tier.id);
      }
    });
    await this.invalidateGuildCache(dto.guildId);
  }

  public async toggleFeature(dto: ToggleGuildFeatureDto): Promise<void> {
    await this.db.getDb().transaction(async (tx) => {
      const settings = await this.guildSettingsRepo.getByGuildId(tx, dto.guildId);
      if (!settings) {
        throw new Error(`Guild '${dto.guildId}' not initialized. Cannot toggle feature.`);
      }

      const feature = await this.featureRepo.getByCode(tx, dto.featureCode);
      if (!feature) throw new Error(`Feature '${dto.featureCode}' not found.`);

      await this.overrideService.setOverride(tx, {
        guildId: dto.guildId,
        featureId: feature.id,
        isEnabled: dto.isEnabled,
      });
    });
    await this.invalidateGuildCache(dto.guildId);
  }

  public async setCommandPermissions(dto: SetCommandPermissionDto): Promise<void> {
    await this.db.getDb().transaction(async (tx) => {
      const settings = await this.guildSettingsRepo.getByGuildId(tx, dto.guildId);
      if (!settings) {
         const defaultTier = await this.tierRepo.getDefaultTier(tx);
         if (defaultTier) {
            await this.guildSettingsService.create(tx, {
              guildId: dto.guildId,
              tierId: defaultTier.id
            });
         } else {
             throw new Error(`Guild '${dto.guildId}' not initialized and no default tier found.`);
         }
      }

      const command = await this.commandRepo.getByName(tx, dto.commandName);
      if (!command) {
        throw new Error(`Cannot set permissions: Command '${dto.commandName}' does not exist.`);
      }

      await this.permService.upsert(tx, dto);
    });
    await this.invalidateGuildCache(dto.guildId);
  }
}