import { DbConnection } from '@/infrastructure/database/core/types';
import { systemFeatures } from '@/infrastructure/database/schema';
import { CreateSystemFeatureDto } from '@/infrastructure/database/dtos/platform/catalog.dtos';

export class SystemFeaturePersistenceService {
  async create(db: DbConnection, dto: CreateSystemFeatureDto): Promise<string> {
    const [created] = await db
      .insert(systemFeatures)
      .values(dto)
      .returning({ id: systemFeatures.id });
    return created.id;
  }
}