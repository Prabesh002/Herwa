import { AppContainer } from '@/core/app-container';
import { DatabaseService } from '@/infrastructure/database/core/database.service';
import { SubscriptionTierRepository } from '@/infrastructure/database/repositories/platform/catalog/subscription-tier.repository';
import { SystemFeatureRepository } from '@/infrastructure/database/repositories/platform/catalog/system-feature.repository';
import { SubscriptionTierPersistenceService } from '@/infrastructure/database/services/platform/catalog/subscription-tier.persistence.service';
import { SystemFeaturePersistenceService } from '@/infrastructure/database/services/platform/catalog/system-feature.persistence.service';
import { SystemCommandPersistenceService } from '@/infrastructure/database/services/platform/catalog/system-command.persistence.service';
import { TierFeaturePersistenceService } from '@/infrastructure/database/services/platform/catalog/tier-feature.persistence.service';
import { CreateFeatureDto, CreateTierDto, EnsureDefaultCatalogDto, LinkFeatureToTierDto, RegisterCommandDto } from '@/core/dtos/manager.dtos';

export class CatalogManager {
  private db = AppContainer.getInstance().get(DatabaseService);
  
  private tierRepo = AppContainer.getInstance().get(SubscriptionTierRepository);
  private featureRepo = AppContainer.getInstance().get(SystemFeatureRepository);
  
  private tierService = AppContainer.getInstance().get(SubscriptionTierPersistenceService);
  private featureService = AppContainer.getInstance().get(SystemFeaturePersistenceService);
  private commandService = AppContainer.getInstance().get(SystemCommandPersistenceService);
  private tierFeatureService = AppContainer.getInstance().get(TierFeaturePersistenceService);

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

  public async createTier(dto: CreateTierDto) {
    return await this.db.getDb().transaction(async (tx) => {
      const existing = await this.tierRepo.getByName(tx, dto.name);
      if (existing) {
        throw new Error(`Subscription tier with name '${dto.name}' already exists.`);
      }

      const newTierId = await this.tierService.create(tx, dto);
      const newTier = await this.tierRepo.getById(tx, newTierId);
      if (!newTier) throw new Error('Failed to create tier.');
      
      return newTier;
    });
  }

  public async createFeature(dto: CreateFeatureDto) {
    return await this.db.getDb().transaction(async (tx) => {
      const existing = await this.featureRepo.getByCode(tx, dto.code);
      if (existing) {
        throw new Error(`System feature with code '${dto.code}' already exists.`);
      }

      const newFeatureId = await this.featureService.create(tx, dto);
      const newFeature = await this.featureRepo.getById(tx, newFeatureId);
      if (!newFeature) throw new Error('Failed to create feature.');

      return newFeature;
    });
  }

  public async linkFeatureToTier(dto: LinkFeatureToTierDto): Promise<void> {
    await this.db.getDb().transaction(async (tx) => {
      const tier = await this.tierRepo.getByName(tx, dto.tierName);
      if (!tier) throw new Error(`Tier '${dto.tierName}' not found.`);

      const feature = await this.featureRepo.getByCode(tx, dto.featureCode);
      if (!feature) throw new Error(`Feature '${dto.featureCode}' not found.`);

      await this.tierFeatureService.link(tx, {
        tierId: tier.id,
        featureId: feature.id,
      });
    });
  }
}