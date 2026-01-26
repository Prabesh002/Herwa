import { eq, and } from 'drizzle-orm';
import { DbConnection } from '@/infrastructure/database/core/types';
import { guildCommandPermissions } from '@/infrastructure/database/schema';

export class GuildCommandPermissionRepository {
  async getPermissions(db: DbConnection, guildId: string, commandName: string) {
    return db.query.guildCommandPermissions.findFirst({
      where: and(
        eq(guildCommandPermissions.guildId, guildId),
        eq(guildCommandPermissions.commandName, commandName)
      ),
    });
  }
}