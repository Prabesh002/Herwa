import { AppContainer } from '@/core/app-container';
import { DatabaseService } from '@/infrastructure/database/core/database.service';
import { voiceSessions } from '@/infrastructure/database/schema';

type NewVoiceSession = typeof voiceSessions.$inferInsert;

export class VoicePersistenceService {
  private readonly db = AppContainer.getInstance().get(DatabaseService).getDb();

  public async recordVoiceSession(data: NewVoiceSession): Promise<void> {
    await this.db.insert(voiceSessions).values(data);
  }
}