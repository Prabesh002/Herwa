import { eq } from 'drizzle-orm';
import { DbConnection } from '@/infrastructure/database/core/types';
import { systemCommands, systemFeatures } from '@/infrastructure/database/schema';
import { InferSelectModel } from 'drizzle-orm';

type CommandWithFeature = InferSelectModel<typeof systemCommands> & {
  feature: InferSelectModel<typeof systemFeatures>;
};

export class SystemCommandRepository {
  async getByName(db: DbConnection, commandName: string): Promise<CommandWithFeature | undefined> {
    return db.query.systemCommands.findFirst({
      where: eq(systemCommands.discordCommandName, commandName),
      with: {
        feature: true, 
      }
    });
  }
}