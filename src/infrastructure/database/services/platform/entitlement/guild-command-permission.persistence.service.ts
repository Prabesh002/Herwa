import { DbConnection } from '@/infrastructure/database/core/types';
import { guildCommandPermissions } from '@/infrastructure/database/schema';
import { SetGuildCommandPermissionDto } from '@/infrastructure/database/dtos/platform/entitlement.dtos';

export class GuildCommandPermissionPersistenceService {
  async upsert(db: DbConnection, dto: SetGuildCommandPermissionDto): Promise<string> {
    const [record] = await db
      .insert(guildCommandPermissions)
      .values(dto)
      .returning({ id: guildCommandPermissions.id });

    if (!record) {
      throw new Error('Failed to set guild command permission.');
    }
    return record.id;
  }
}