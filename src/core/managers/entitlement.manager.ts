import { AppContainer } from '@/core/app-container';
import { EntitlementService } from '@/core/services/entitlement.service';
import { DatabaseService } from '@/infrastructure/database/core/database.service';
import { SubscriptionTierRepository } from '@/infrastructure/database/repositories/platform/catalog/subscription-tier.repository';
import { GuildSettingsPersistenceService } from '@/infrastructure/database/services/platform/entitlement/guild-settings.persistence.service';
import { ChangeGuildTierDto, ToggleGuildFeatureDto, SetCommandPermissionDto, EntitlementCheckDto } from '@/core/dtos/manager.dtos';
import { EntitlementResult, EntitlementDenialReason } from '@/core/dtos/results.dtos';

export class EntitlementManager {
  private db = AppContainer.getInstance().get(DatabaseService);
  private entitlementService = AppContainer.getInstance().get(EntitlementService);

  private tierRepo = AppContainer.getInstance().get(SubscriptionTierRepository);
  private guildSettingsService = AppContainer.getInstance().get(GuildSettingsPersistenceService);

  public async initializeGuild(guildId: string): Promise<void> {
    const existing = await this.entitlementService.getGuildEntitlements(guildId);
    if (existing) return;
    
    await this.db.getDb().transaction(async (tx) => {
      const defaultTier = await this.tierRepo.getDefaultTier(tx);
      if (!defaultTier) throw new Error('System configuration error: No default tier found.');
      
      await this.guildSettingsService.create(tx, {
        guildId: guildId,
        tierId: defaultTier.id,
      });
    });
    await this.entitlementService.invalidateGuildCache(guildId);
  }
  
  public async checkEntitlement(dto: EntitlementCheckDto): Promise<EntitlementResult> {
    const { guildId, commandName, channelId, memberRoles } = dto;
    
    const globalCommands = await this.entitlementService.getGlobalCommands();
    const command = globalCommands.get(commandName);

    if (!command) {
      return { isEntitled: false, reasonCode: EntitlementDenialReason.COMMAND_NOT_FOUND, message: 'This command does not exist.' };
    }
    if (!command.isGlobalEnabled) {
      return { isEntitled: false, reasonCode: EntitlementDenialReason.FEATURE_DISABLED_GLOBALLY, message: 'This feature is temporarily disabled by the developers.' };
    }
    if (command.isMaintenance) {
      return { isEntitled: false, reasonCode: EntitlementDenialReason.COMMAND_IN_MAINTENANCE, message: 'This command is currently under maintenance.' };
    }
    
    let guildEntitlements = await this.entitlementService.getGuildEntitlements(guildId);
    if (!guildEntitlements) {
      await this.initializeGuild(guildId);
      guildEntitlements = await this.entitlementService.getGuildEntitlements(guildId);
      if (!guildEntitlements) {
        return { isEntitled: false, reasonCode: EntitlementDenialReason.GUILD_NOT_INITIALIZED, message: 'Could not initialize settings for this server. Please try again.' };
      }
    }
    
    if (guildEntitlements.subscriptionExpiresAt && new Date(guildEntitlements.subscriptionExpiresAt) < new Date()) {
      return { isEntitled: false, reasonCode: EntitlementDenialReason.SUBSCRIPTION_EXPIRED, message: 'Your premium subscription for this bot has expired.' };
    }

    if (!guildEntitlements.tierFeatures.has(command.featureCode)) {
      return { isEntitled: false, reasonCode: EntitlementDenialReason.TIER_MISSING_FEATURE,  message: `This feature is not available on your current tier (${guildEntitlements.tierName}).`  };
    }

    if (guildEntitlements.disabledFeatures.has(command.featureId)) {
      return { isEntitled: false, reasonCode: EntitlementDenialReason.FEATURE_DISABLED_BY_ADMIN, message: 'This feature is disabled in this server.' };
    }

    const permissions = guildEntitlements.commandPermissions.get(commandName);
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
    await this.entitlementService.setGuildTier(dto);
  }

  public async toggleFeature(dto: ToggleGuildFeatureDto): Promise<void> {
    await this.entitlementService.toggleFeature(dto);
  }

  public async setCommandPermissions(dto: SetCommandPermissionDto): Promise<void> {
    await this.entitlementService.setCommandPermissions(dto);
  }
}