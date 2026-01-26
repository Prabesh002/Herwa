import { AppContainer } from '@/core/app-container';
import { DatabaseService } from '@/infrastructure/database/core/database.service';
import { GuildSettingsRepository } from '@/infrastructure/database/repositories/platform/entitlement/guild-settings.repository';
import { SubscriptionTierRepository } from '@/infrastructure/database/repositories/platform/catalog/subscription-tier.repository';
import { SystemFeatureRepository } from '@/infrastructure/database/repositories/platform/catalog/system-feature.repository';
import { SystemCommandRepository } from '@/infrastructure/database/repositories/platform/catalog/system-command.repository';
import { GuildFeatureOverrideRepository } from '@/infrastructure/database/repositories/platform/entitlement/guild-feature-override.repository';
import { GuildCommandPermissionRepository } from '@/infrastructure/database/repositories/platform/entitlement/guild-command-permission.repository';
import { GuildSettingsPersistenceService } from '@/infrastructure/database/services/platform/entitlement/guild-settings.persistence.service';
import { GuildFeatureOverridePersistenceService } from '@/infrastructure/database/services/platform/entitlement/guild-feature-override.persistence.service';
import { GuildCommandPermissionPersistenceService } from '@/infrastructure/database/services/platform/entitlement/guild-command-permission.persistence.service';
import { ChangeGuildTierDto, ToggleGuildFeatureDto, SetCommandPermissionDto, EntitlementCheckDto } from '@/core/dtos/manager.dtos';
import { EntitlementResult, EntitlementDenialReason } from '@/core/dtos/results.dtos';
import { tierFeatures } from '@/infrastructure/database/schema';
import { eq, and } from 'drizzle-orm';

export class EntitlementManager {
  private db = AppContainer.getInstance().get(DatabaseService);

  private guildSettingsRepo = AppContainer.getInstance().get(GuildSettingsRepository);
  private tierRepo = AppContainer.getInstance().get(SubscriptionTierRepository);
  private featureRepo = AppContainer.getInstance().get(SystemFeatureRepository);
  private commandRepo = AppContainer.getInstance().get(SystemCommandRepository);
  private overrideRepo = AppContainer.getInstance().get(GuildFeatureOverrideRepository);
  private permRepo = AppContainer.getInstance().get(GuildCommandPermissionRepository);

  private guildSettingsService = AppContainer.getInstance().get(GuildSettingsPersistenceService);
  private overrideService = AppContainer.getInstance().get(GuildFeatureOverridePersistenceService);
  private permService = AppContainer.getInstance().get(GuildCommandPermissionPersistenceService);

  public async initializeGuild(guildId: string): Promise<void> {
    await this.db.getDb().transaction(async (tx) => {
      const existing = await this.guildSettingsRepo.getByGuildId(tx, guildId);
      if (existing) return;

      const defaultTier = await this.tierRepo.getDefaultTier(tx);
      if (!defaultTier) throw new Error('System configuration error: No default tier found.');
      
      await this.guildSettingsService.create(tx, {
        guildId: guildId,
        tierId: defaultTier.id,
      });
    });
  }
  
  public async checkEntitlement(dto: EntitlementCheckDto): Promise<EntitlementResult> {
    const { guildId, commandName, channelId, memberRoles } = dto;
    const db = this.db.getDb();
    
    // TODO: Cache this later, will require redis, need to think of this later
    
    const command = await this.commandRepo.getByName(db, commandName);
    if (!command || !command.feature) {
      return { isEntitled: false, reasonCode: EntitlementDenialReason.COMMAND_NOT_FOUND, message: 'This command does not exist.' };
    }

    let guildSettings = await this.guildSettingsRepo.getByGuildId(db, guildId);
    if (!guildSettings) {
      await this.initializeGuild(guildId);
      guildSettings = await this.guildSettingsRepo.getByGuildId(db, guildId);
      if (!guildSettings) {
        return { isEntitled: false, reasonCode: EntitlementDenialReason.GUILD_NOT_INITIALIZED, message: 'Could not initialize settings for this server. Please try again.' };
      }
    }

    if (!command.feature.isGlobalEnabled) {
      return { isEntitled: false, reasonCode: EntitlementDenialReason.FEATURE_DISABLED_GLOBALLY, message: 'This feature is temporarily disabled by the developers.' };
    }
    if (command.isMaintenance) {
      return { isEntitled: false, reasonCode: EntitlementDenialReason.COMMAND_IN_MAINTENANCE, message: 'This command is currently under maintenance.' };
    }

    if (guildSettings.subscriptionExpiresAt && guildSettings.subscriptionExpiresAt < new Date()) {
      return { isEntitled: false, reasonCode: EntitlementDenialReason.SUBSCRIPTION_EXPIRED, message: 'Your premium subscription for this bot has expired.' };
    }

    const tierFeature = await db.query.tierFeatures.findFirst({
      where: and(
        eq(tierFeatures.tierId, guildSettings.tierId), 
        eq(tierFeatures.featureId, command.feature.id)
      )
    });
    if (!tierFeature) {
      return { isEntitled: false, reasonCode: EntitlementDenialReason.TIER_MISSING_FEATURE, message: `This command requires the '${guildSettings.tier.name}' tier or higher.` };
    }

    const override = await this.overrideRepo.getOverride(db, guildId, command.feature.id);
    if (override && override.isEnabled === false) {
      return { isEntitled: false, reasonCode: EntitlementDenialReason.FEATURE_DISABLED_BY_ADMIN, message: `The '${command.feature.name}' module is disabled in this server.` };
    }

    const permissions = await this.permRepo.getPermissions(db, guildId, commandName);
    if (permissions) {
      if (permissions.denyRoleIds?.some(roleId => memberRoles.includes(roleId))) {
        return { isEntitled: false, reasonCode: EntitlementDenialReason.ROLE_DENIED, message: 'You are explicitly denied from using this command.' };
      }
      if (permissions.allowedChannelIds && permissions.allowedChannelIds.length > 0 && !permissions.allowedChannelIds.includes(channelId)) {
        return { isEntitled: false, reasonCode: EntitlementDenialReason.INVALID_CHANNEL, message: 'This command cannot be used in this channel.' };
      }
      if (permissions.allowedRoleIds && permissions.allowedRoleIds.length > 0 && !permissions.allowedRoleIds.some(roleId => memberRoles.includes(roleId))) {
        return { isEntitled: false, reasonCode: EntitlementDenialReason.MISSING_ROLE, message: 'You do not have the required role to use this command.' };
      }
    }

    return { isEntitled: true };
  }

  public async setGuildTier(dto: ChangeGuildTierDto): Promise<void> {
    await this.db.getDb().transaction(async (tx) => {
      const tier = await this.tierRepo.getByName(tx, dto.tierName);
      if (!tier) throw new Error(`Tier '${dto.tierName}' not found.`);

      const settings = await this.guildSettingsRepo.getByGuildId(tx, dto.guildId);
      if (!settings) {
        await this.initializeGuild(dto.guildId);
      }
      
      await this.guildSettingsService.updateTier(tx, dto.guildId, tier.id);
    });
  }

  public async toggleFeature(dto: ToggleGuildFeatureDto): Promise<void> {
    await this.db.getDb().transaction(async (tx) => {
      const feature = await this.featureRepo.getByCode(tx, dto.featureCode);
      if (!feature) throw new Error(`Feature '${dto.featureCode}' not found.`);

      await this.overrideService.setOverride(tx, {
        guildId: dto.guildId,
        featureId: feature.id,
        isEnabled: dto.isEnabled,
      });
    });
  }

  public async setCommandPermissions(dto: SetCommandPermissionDto): Promise<void> {
    await this.db.getDb().transaction(async (tx) => {
      const command = await this.commandRepo.getByName(tx, dto.commandName);
      if (!command) {
        throw new Error(`Cannot set permissions: Command '${dto.commandName}' does not exist.`);
      }

      await this.permService.upsert(tx, {
        guildId: dto.guildId,
        commandName: dto.commandName,
        allowedRoleIds: dto.allowedRoleIds,
        allowedChannelIds: dto.allowedChannelIds,
        denyRoleIds: dto.denyRoleIds,
      });
    });
  }
}