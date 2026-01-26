import { AppContainer } from '@/core/app-container';
import { DatabaseService } from '@/infrastructure/database/core/database.service';
import { memberLifecycleEvents } from '@/infrastructure/database/schema';

export interface RecordMemberData {
  guildId: string;
  userId: string;
}

export class MemberPersistenceService {
  private readonly db = AppContainer.getInstance().get(DatabaseService).getDb();

  public async recordMemberJoin(data: RecordMemberData): Promise<void> {
    await this.db.insert(memberLifecycleEvents).values({
      ...data,
      eventType: 'JOIN',
    });
  }

  public async recordMemberLeave(data: RecordMemberData): Promise<void> {
    await this.db.insert(memberLifecycleEvents).values({
      ...data,
      eventType: 'LEAVE',
    });
  }
}