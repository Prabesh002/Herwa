import { eq } from 'drizzle-orm';
import { DbConnection } from '@/infrastructure/database/core/types';
import { guildSettings } from '@/infrastructure/database/schema';

export class GuildSettingsRepository {
  async getByGuildId(db: DbConnection, guildId: string) {
    return db.query.guildSettings.findFirst({
      where: eq(guildSettings.guildId, guildId),
      with: {
        tier: true,
      },
    });
  }
}