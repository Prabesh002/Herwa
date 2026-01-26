import { AppContainer } from '@/core/app-container';
import { DatabaseService } from '@/infrastructure/database/core/database.service';
import { messageEvents, MessageKind } from '@/infrastructure/database/schema';

export interface RecordMessageData {
  guildId: string;
  channelId: string;
  userId: string;
  isBot: boolean;
  messageKind: MessageKind;
}

export class MessagePersistenceService {
  private readonly db = AppContainer.getInstance().get(DatabaseService).getDb();

  public async recordMessageCreate(data: RecordMessageData): Promise<void> {
    await this.db.insert(messageEvents).values(data);
  }
}