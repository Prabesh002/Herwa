import { eq } from 'drizzle-orm';
import { DbConnection } from '@/infrastructure/database/core/types';
import { systemCommands } from '@/infrastructure/database/schema';

export class SystemCommandRepository {
  async getByName(db: DbConnection, commandName: string) {
    return db.query.systemCommands.findFirst({
      where: eq(systemCommands.discordCommandName, commandName),
      with: {
        feature: true, 
      }
    });
  }
}