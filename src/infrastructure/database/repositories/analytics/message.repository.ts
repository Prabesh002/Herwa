import { count, eq } from 'drizzle-orm';
import { AppContainer } from '@/core/app-container';
import { DatabaseService } from '@/infrastructure/database/core/database.service';
import { messageEvents } from '@/infrastructure/database/schema';

export class MessageRepository {
  private readonly db = AppContainer.getInstance().get(DatabaseService).getDb();

  public async getTotalCountByGuild(guildId: string): Promise<number> {
    const [result] = await this.db
      .select({ value: count() })
      .from(messageEvents)
      .where(eq(messageEvents.guildId, guildId));
    return result?.value || 0;
  }
}