import { count, eq, and } from 'drizzle-orm';
import { AppContainer } from '@/core/app-container';
import { DatabaseService } from '@/infrastructure/database/core/database.service';
import { memberLifecycleEvents } from '@/infrastructure/database/schema';

export class MemberLifecycleRepository {
  private readonly db = AppContainer.getInstance().get(DatabaseService).getDb();

  public async getJoinCountByGuild(guildId: string): Promise<number> {
    const [result] = await this.db
      .select({ value: count() })
      .from(memberLifecycleEvents)
      .where(and(
        eq(memberLifecycleEvents.guildId, guildId),
        eq(memberLifecycleEvents.eventType, 'JOIN')
      ));
    return result?.value || 0;
  }

  public async getLeaveCountByGuild(guildId: string): Promise<number> {
    const [result] = await this.db
      .select({ value: count() })
      .from(memberLifecycleEvents)
      .where(and(
        eq(memberLifecycleEvents.guildId, guildId),
        eq(memberLifecycleEvents.eventType, 'LEAVE')
      ));
    return result?.value || 0;
  }
}