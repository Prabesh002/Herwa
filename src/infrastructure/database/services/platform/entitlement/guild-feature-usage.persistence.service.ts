import { DbConnection } from '@/infrastructure/database/core/types';
import { guildFeatureUsage } from '@/infrastructure/database/schema';
import { UpsertGuildFeatureUsageDto } from '@/infrastructure/database/dtos/platform/entitlement.dtos';
import { sql } from 'drizzle-orm';

export class GuildFeatureUsagePersistenceService {
  async upsert(db: DbConnection, dto: UpsertGuildFeatureUsageDto): Promise<void> {
    await db
      .insert(guildFeatureUsage)
      .values({
        guildId: dto.guildId,
        featureId: dto.featureId,
        periodStart: dto.periodStart,
        periodEnd: dto.periodEnd,
        usageCount: dto.usageCount,
      })
      .onConflictDoUpdate({
        target: [guildFeatureUsage.guildId, guildFeatureUsage.featureId, guildFeatureUsage.periodStart],
        set: {
          usageCount: sql`${guildFeatureUsage.usageCount} + ${dto.usageCount}`,
        },
      });
  }
}