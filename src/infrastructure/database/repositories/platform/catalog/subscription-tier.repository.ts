import { eq } from 'drizzle-orm';
import { DbConnection } from '@/infrastructure/database/core/types';
import { subscriptionTiers } from '@/infrastructure/database/schema';

export class SubscriptionTierRepository {
  async getById(db: DbConnection, id: string) {
    return db.query.subscriptionTiers.findFirst({
      where: eq(subscriptionTiers.id, id),
    });
  }

  async getByName(db: DbConnection, name: string) {
    return db.query.subscriptionTiers.findFirst({
      where: eq(subscriptionTiers.name, name),
    });
  }

  async getDefaultTier(db: DbConnection) {
    return db.query.subscriptionTiers.findFirst({
      where: eq(subscriptionTiers.isDefault, true),
    });
  }
}