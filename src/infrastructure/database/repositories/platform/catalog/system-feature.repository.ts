import { eq } from 'drizzle-orm';
import { DbConnection } from '@/infrastructure/database/core/types';
import { systemFeatures } from '@/infrastructure/database/schema';

export class SystemFeatureRepository {
  async getById(db: DbConnection, id: string) {
    return db.query.systemFeatures.findFirst({
      where: eq(systemFeatures.id, id),
    });
  }

  async getByCode(db: DbConnection, code: string) {
    return db.query.systemFeatures.findFirst({
      where: eq(systemFeatures.code, code),
    });
  }
}