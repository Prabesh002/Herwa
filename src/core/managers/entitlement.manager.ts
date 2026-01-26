import { AppContainer } from '@/core/app-container';
import { DatabaseService } from '@/infrastructure/database/core/database.service';
import { GuildSettingsRepository } from '@/infrastructure/database/repositories/platform/entitlement/guild-settings.repository';
import { SubscriptionTierRepository } from '@/infrastructure/database/repositories/platform/catalog/subscription-tier.repository';
import { SystemFeatureRepository } from '@/infrastructure/database/repositories/platform/catalog/system-feature.repository';
import { GuildSettingsPersistenceService } from '@/infrastructure/database/services/platform/entitlement/guild-settings.persistence.service';
import { GuildFeatureOverridePersistenceService } from '@/infrastructure/database/services/platform/entitlement/guild-feature-override.persistence.service';
import { GuildCommandPermissionPersistenceService } from '@/infrastructure/database/services/platform/entitlement/guild-command-permission.persistence.service';
import { ChangeGuildTierDto, ToggleGuildFeatureDto, SetCommandPermissionDto } from '@/core/dtos/manager.dtos';

export class EntitlementManager {
  private db = AppContainer.getInstance().get(DatabaseService);

  // Reads
  private guildSettingsRepo = AppContainer.getInstance().get(GuildSettingsRepository);
  private tierRepo = AppContainer.getInstance().get(SubscriptionTierRepository);
  private featureRepo = AppContainer.getInstance().get(SystemFeatureRepository);

  // Writes
  private guildSettingsService = AppContainer.getInstance().get(GuildSettingsPersistenceService);
  private overrideService = AppContainer.getInstance().get(GuildFeatureOverridePersistenceService);
  private permService = AppContainer.getInstance().get(GuildCommandPermissionPersistenceService);

  /**
   * Updates a guild's tier (e.g., after a successful payment or manual upgrade).
   * Handles lazy creation of guild settings if they don't exist.
   */
  public async setGuildTier(dto: ChangeGuildTierDto): Promise<void> {
    await this.db.getDb().transaction(async (tx) => {
      // 1. Resolve Tier Name to ID
      const tier = await this.tierRepo.getByName(tx, dto.tierName);
      if (!tier) throw new Error(`Tier '${dto.tierName}' not found.`);

      // 2. Check if guild exists
      const settings = await this.guildSettingsRepo.getByGuildId(tx, dto.guildId);

      if (!settings) {
        await this.guildSettingsService.create(tx, {
          guildId: dto.guildId,
          tierId: tier.id,
        });
      } else {
        await this.guildSettingsService.updateTier(tx, dto.guildId, tier.id);
      }
    });
  }

  /**
   * Manually enables/disables a specific feature for a guild.
   */
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

  /**
   * Sets RBAC permissions for a specific command in a guild.
   */
  public async setCommandPermissions(dto: SetCommandPermissionDto): Promise<void> {
    await this.db.getDb().transaction(async (tx) => {
      // Logic for checking if command exists could go here, 
      // but sticking to DB constraints is often faster.
      // TODO : add the check later.
      
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