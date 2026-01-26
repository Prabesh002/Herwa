import { DbConnection } from '@/infrastructure/database/core/types';
import { subscriptionTiers } from '@/infrastructure/database/schema';
import { CreateSubscriptionTierDto } from '@/infrastructure/database/dtos/platform/catalog.dtos';

export class SubscriptionTierPersistenceService {
  async create(db: DbConnection, dto: CreateSubscriptionTierDto): Promise<string> {
    const [created] = await db
      .insert(subscriptionTiers)
      .values(dto)
      .returning({ id: subscriptionTiers.id });

    if (!created) {
      throw new Error('Failed to create subscription tier.');
    }
    return created.id;
  }
}