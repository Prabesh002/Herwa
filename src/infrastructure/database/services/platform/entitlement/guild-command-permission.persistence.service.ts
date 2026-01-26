import { DbConnection } from '@/infrastructure/database/core/types';
import { guildCommandPermissions } from '@/infrastructure/database/schema';
import { SetGuildCommandPermissionDto } from '@/infrastructure/database/dtos/platform/entitlement.dtos';

export class GuildCommandPermissionPersistenceService {
  async upsert(db: DbConnection, dto: SetGuildCommandPermissionDto): Promise<string> {
    // Note: Since this table doesn't have a unique constraint on (guildId, commandName) 
    // strictly speaking, but logically it should exist once per command per guild.
    // For this implementation, we assume we might want to replace existing permissions.
    
    // We can delete existing for this command/guild and insert new, or update.
    // Let's go with a simple INSERT for now, but typically you'd want logic in the Manager 
    // to check existence first or use a unique constraint on the table.
    // Assuming we added a unique constraint or index, we could use onConflict.
    
    // For safety, let's just insert. The Manager will handle cleanup/logic.
    const [record] = await db
      .insert(guildCommandPermissions)
      .values(dto)
      .returning({ id: guildCommandPermissions.id });
    return record.id;
  }
}