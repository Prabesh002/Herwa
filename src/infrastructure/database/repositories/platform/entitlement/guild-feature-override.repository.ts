import { eq, and } from 'drizzle-orm';
import { DbConnection } from '@/infrastructure/database/core/types';
import { guildFeatureOverrides } from '@/infrastructure/database/schema';

export class GuildFeatureOverrideRepository {
  async getOverride(db: DbConnection, guildId: string, featureId: string) {
    return db.query.guildFeatureOverrides.findFirst({
      where: and(
        eq(guildFeatureOverrides.guildId, guildId),
        eq(guildFeatureOverrides.featureId, featureId)
      ),
    });
  }
}