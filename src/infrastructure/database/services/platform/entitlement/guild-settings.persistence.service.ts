import { DbConnection } from '@/infrastructure/database/core/types';
import { guildSettings } from '@/infrastructure/database/schema';
import { CreateGuildSettingsDto } from '@/infrastructure/database/dtos/platform/entitlement.dtos';
import { eq } from 'drizzle-orm';

export class GuildSettingsPersistenceService {
  async create(db: DbConnection, dto: CreateGuildSettingsDto): Promise<void> {
    await db.insert(guildSettings).values(dto).onConflictDoNothing();
  }

  async updateTier(db: DbConnection, guildId: string, tierId: string): Promise<void> {
    // This is a direct update, usually called by a subscription manager
    await db.update(guildSettings)
      .set({ tierId })
      .where(eq(guildSettings.guildId, guildId));
  }
}
