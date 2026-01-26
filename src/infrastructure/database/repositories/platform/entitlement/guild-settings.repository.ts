import { eq } from 'drizzle-orm';
import { DbConnection } from '@/infrastructure/database/core/types';
import { guildSettings, subscriptionTiers } from '@/infrastructure/database/schema';
import { InferSelectModel } from 'drizzle-orm';


type GuildSettingsWithTier = InferSelectModel<typeof guildSettings> & {
  tier: InferSelectModel<typeof subscriptionTiers>;
};

export class GuildSettingsRepository {
  async getByGuildId(db: DbConnection, guildId: string): Promise<GuildSettingsWithTier | undefined> {
    return db.query.guildSettings.findFirst({
      where: eq(guildSettings.guildId, guildId),
      with: {
        tier: true,
      },
    });
  }
}