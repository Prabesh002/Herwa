import { eq, desc } from 'drizzle-orm';
import { DbConnection } from '@/infrastructure/database/core/types';
import { guildSubscriptions } from '@/infrastructure/database/schema';

export class GuildSubscriptionRepository {
  async getLatestForGuild(db: DbConnection, guildId: string) {
    return db.query.guildSubscriptions.findFirst({
      where: eq(guildSubscriptions.guildId, guildId),
      orderBy: [desc(guildSubscriptions.createdAt)],
    });
  }
}