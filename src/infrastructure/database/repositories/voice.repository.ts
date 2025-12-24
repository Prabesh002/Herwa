import { eq, sum } from 'drizzle-orm';
import { AppContainer } from '@/core/app-container';
import { DatabaseService } from '@/infrastructure/database/core/database.service';
import { voiceSessions } from '@/infrastructure/database/schema';

export class VoiceRepository {
  private readonly db = AppContainer.getInstance().get(DatabaseService).getDb();

  public async getTotalDurationByGuild(guildId: string): Promise<number> {
    const [result] = await this.db
      .select({ value: sum(voiceSessions.durationSeconds) })
      .from(voiceSessions)
      .where(eq(voiceSessions.guildId, guildId));
    return Number(result?.value) || 0;
  }
}