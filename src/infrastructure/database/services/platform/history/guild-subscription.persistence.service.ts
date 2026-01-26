import { DbConnection } from '@/infrastructure/database/core/types';
import { guildSubscriptions } from '@/infrastructure/database/schema';
import { CreateGuildSubscriptionDto } from '@/infrastructure/database/dtos/platform/history.dtos';

export class GuildSubscriptionPersistenceService {
  async create(db: DbConnection, dto: CreateGuildSubscriptionDto): Promise<string> {
    const [record] = await db
      .insert(guildSubscriptions)
      .values(dto)
      .returning({ id: guildSubscriptions.id });

    if (!record) {
      throw new Error('Failed to create guild subscription record.');
    }
    return record.id;
  }
}