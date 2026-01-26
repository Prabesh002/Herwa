import { DbConnection } from '@/infrastructure/database/core/types';
import { systemCommands } from '@/infrastructure/database/schema';
import { UpsertSystemCommandDto } from '@/infrastructure/database/dtos/platform/catalog.dtos';

export class SystemCommandPersistenceService {
  async upsert(db: DbConnection, dto: UpsertSystemCommandDto): Promise<string> {
    const [record] = await db
      .insert(systemCommands)
      .values(dto)
      .onConflictDoUpdate({
        target: systemCommands.discordCommandName,
        set: {
          featureId: dto.featureId,
          description: dto.description,
        },
      })
      .returning({ id: systemCommands.id });

    if (!record) {
      throw new Error(`Failed to upsert system command: ${dto.discordCommandName}`);
    }
    return record.id;
  }
}