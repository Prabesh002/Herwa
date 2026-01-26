import { AppContainer } from '@/core/app-container';
import { DatabaseService } from '@/infrastructure/database/core/database.service';
import { SubscriptionTierRepository } from '@/infrastructure/database/repositories/platform/catalog/subscription-tier.repository';
import { SystemFeatureRepository } from '@/infrastructure/database/repositories/platform/catalog/system-feature.repository';
import { SubscriptionTierPersistenceService } from '@/infrastructure/database/services/platform/catalog/subscription-tier.persistence.service';
import { SystemFeaturePersistenceService } from '@/infrastructure/database/services/platform/catalog/system-feature.persistence.service';
import { SystemCommandPersistenceService } from '@/infrastructure/database/services/platform/catalog/system-command.persistence.service';
import { EnsureDefaultCatalogDto, RegisterCommandDto } from '@/core/dtos/manager.dtos';

export class CatalogManager {
  private db = AppContainer.getInstance().get(DatabaseService);
  
  private tierRepo = AppContainer.getInstance().get(SubscriptionTierRepository);
  private featureRepo = AppContainer.getInstance().get(SystemFeatureRepository);
  
  private tierService = AppContainer.getInstance().get(SubscriptionTierPersistenceService);
  private featureService = AppContainer.getInstance().get(SystemFeaturePersistenceService);
  private commandService = AppContainer.getInstance().get(SystemCommandPersistenceService);

  /**
   * Idempotent method to ensure the base system exists (Free Tier, Core Feature).
   * Runs on startup/seeding.
   */
  public async ensureDefaults(dto: EnsureDefaultCatalogDto): Promise<void> {
    await this.db.getDb().transaction(async (tx) => {
      const existingFree = await this.tierRepo.getByName(tx, dto.freeTierName);
      if (!existingFree) {
        await this.tierService.create(tx, {
          name: dto.freeTierName,
          priceMonthly: dto.freeTierPrice,
          isDefault: true,
          description: dto.freeTierDescription,
        });
      }

      const existingCore = await this.featureRepo.getByCode(tx, dto.coreFeatureCode);
      if (!existingCore) {
        await this.featureService.create(tx, {
          code: dto.coreFeatureCode,
          name: dto.coreFeatureName,
          isGlobalEnabled: true,
          description: dto.coreFeatureDescription,
        });
      }
    });
  }

  /**
   * Scans code-based commands and registers them in the DB.
   * Links them to a feature code (e.g., 'analytics').
   */
  public async registerCommand(dto: RegisterCommandDto): Promise<void> {
    await this.db.getDb().transaction(async (tx) => {
      const feature = await this.featureRepo.getByCode(tx, dto.featureCode);
      if (!feature) {
        throw new Error(`Cannot register command ${dto.commandName}: Feature '${dto.featureCode}' not found.`);
      }

      await this.commandService.upsert(tx, {
        discordCommandName: dto.commandName,
        featureId: feature.id,
        description: dto.description,
      });
    });
  }
}