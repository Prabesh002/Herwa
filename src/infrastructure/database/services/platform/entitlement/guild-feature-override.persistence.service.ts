import { DbConnection } from '@/infrastructure/database/core/types';
import { guildFeatureOverrides } from '@/infrastructure/database/schema';
import { SetGuildFeatureOverrideDto } from '@/infrastructure/database/dtos/platform/entitlement.dtos';

export class GuildFeatureOverridePersistenceService {
  async setOverride(db: DbConnection, dto: SetGuildFeatureOverrideDto): Promise<void> {
    await db.insert(guildFeatureOverrides)
      .values(dto)
      .onConflictDoUpdate({
        target: [guildFeatureOverrides.guildId, guildFeatureOverrides.featureId],
        set: { isEnabled: dto.isEnabled },
      });
  }
}