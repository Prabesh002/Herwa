import { DbConnection } from '@/infrastructure/database/core/types';
import { guildCommandPermissions } from '@/infrastructure/database/schema';
import { SetGuildCommandPermissionDto } from '@/infrastructure/database/dtos/platform/entitlement.dtos';
import { eq, and } from 'drizzle-orm';

export class GuildCommandPermissionPersistenceService {
  async upsert(db: DbConnection, dto: SetGuildCommandPermissionDto): Promise<string> {
    const [record] = await db
      .insert(guildCommandPermissions)
      .values({
        guildId: dto.guildId,
        commandName: dto.commandName,
        allowedRoleIds: dto.allowedRoleIds,
        allowedChannelIds: dto.allowedChannelIds,
        denyRoleIds: dto.denyRoleIds,
      })
      .onConflictDoUpdate({
        target: [guildCommandPermissions.guildId, guildCommandPermissions.commandName],
        set: {
          allowedRoleIds: dto.allowedRoleIds,
          allowedChannelIds: dto.allowedChannelIds,
          denyRoleIds: dto.denyRoleIds,
        }
      })
      .returning({ id: guildCommandPermissions.id });
    
    if (!record) {
      throw new Error('Failed to upsert guild command permission.');
    }
    return record.id;
  }
}