import { DbConnection } from '@/infrastructure/database/core/types';
import { tierFeatures } from '@/infrastructure/database/schema';
import { LinkTierFeatureDto } from '@/infrastructure/database/dtos/platform/catalog.dtos';

export class TierFeaturePersistenceService {
  async link(db: DbConnection, dto: LinkTierFeatureDto): Promise<void> {
    await db.insert(tierFeatures).values(dto);
  }
}