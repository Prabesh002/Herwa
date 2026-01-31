import { AppContainer } from '@/core/app-container';
import { EntitlementService } from '@/core/services/entitlement.service';
import { UsageService } from '@/core/services/usage.service';
import { DatabaseService } from '@/infrastructure/database/core/database.service';
import { SubscriptionTierRepository } from '@/infrastructure/database/repositories/platform/catalog/subscription-tier.repository';
import { GuildSettingsPersistenceService } from '@/infrastructure/database/services/platform/entitlement/guild-settings.persistence.service';
import { ChangeGuildTierDto, ToggleGuildFeatureDto, SetCommandPermissionDto, EntitlementCheckDto } from '@/core/dtos/manager.dtos';
import { EntitlementResult, EntitlementDenialReason } from '@/core/dtos/results.dtos';

export class EntitlementManager {
  private db = AppContainer.getInstance().get(DatabaseService);
  private entitlementService = AppContainer.getInstance().get(EntitlementService);
  private usageService = AppContainer.getInstance().get(UsageService);
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
      return { isEntitled: false, reasonCode: EntitlementDenialReason.FEATURE_DISABLED_GLOBALLY, message: 'This feature is temporarily disabled.' };
    }
    if (command.isMaintenance) {
      return { isEntitled: false, reasonCode: EntitlementDenialReason.COMMAND_IN_MAINTENANCE, message: 'This command is under maintenance.' };
    }
    
    let entitlements = await this.entitlementService.getGuildEntitlements(guildId);
    if (!entitlements) {
      await this.initializeGuild(guildId);
      entitlements = await this.entitlementService.getGuildEntitlements(guildId);
      if (!entitlements) return { isEntitled: false, reasonCode: EntitlementDenialReason.GUILD_NOT_INITIALIZED };
    }
    
    if (entitlements.subscriptionExpiresAt && new Date(entitlements.subscriptionExpiresAt) < new Date()) {
      return { isEntitled: false, reasonCode: EntitlementDenialReason.SUBSCRIPTION_EXPIRED, message: 'Premium subscription expired.' };
    }

    const quota = entitlements.tierFeatures.get(command.featureCode);
    if (!quota) {
      return { isEntitled: false, reasonCode: EntitlementDenialReason.TIER_MISSING_FEATURE, message: `Feature not available on ${entitlements.tierName} tier.` };
    }
    if (quota.limit !== null && quota.resetPeriod !== null) {
      const currentUsage = await this.usageService.getUsage(guildId, command.featureId, quota.resetPeriod);
      if (currentUsage >= quota.limit) {
        return { 
          isEntitled: false, 
          reasonCode: EntitlementDenialReason.SUBSCRIPTION_EXPIRED,
          message: `You have reached the ${quota.resetPeriod.toLowerCase()} usage limit for ${command.featureCode}.` 
        };
      }
    }

    if (entitlements.disabledFeatures.has(command.featureId)) {
      return { isEntitled: false, reasonCode: EntitlementDenialReason.FEATURE_DISABLED_BY_ADMIN, message: 'Feature disabled in this server.' };
    }

    const permissions = entitlements.commandPermissions.get(commandName);
    if (permissions) {
      if (permissions.denyRoleIds?.some(roleId => memberRoles.includes(roleId))) {
        return { isEntitled: false, reasonCode: EntitlementDenialReason.ROLE_DENIED, message: 'Access denied for your role.' };
      }
      if (permissions.allowedChannelIds?.length && !permissions.allowedChannelIds.includes(channelId)) {
        return { isEntitled: false, reasonCode: EntitlementDenialReason.INVALID_CHANNEL, message: 'Command not allowed in this channel.' };
      }
      if (permissions.allowedRoleIds?.length && !permissions.allowedRoleIds.some(roleId => memberRoles.includes(roleId))) {
        return { isEntitled: false, reasonCode: EntitlementDenialReason.MISSING_ROLE, message: 'Missing required role.' };
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