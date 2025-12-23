import { Events, Message } from 'discord.js';
import { IEventHandler } from '@/discord/events/core/event.contract';
import { createLogger, Logger } from '@/infrastructure/logging/logger';
import { AppContainer } from '@/core/app-container';
import { DatabaseService } from '@/infrastructure/database/core/database.service';
import { messageEvents } from '@/infrastructure/database/schema/message-events.schema';
import { MessageKind } from '@/infrastructure/database/schema/enums.schema';

export class MessageCreateHandler implements IEventHandler<Events.MessageCreate> {
  public readonly eventName = Events.MessageCreate;
  private readonly logger: Logger;
  private readonly databaseService: DatabaseService;

  constructor() {
    this.logger = createLogger('info').child({ handler: 'MessageCreate' });
    this.databaseService = AppContainer.getInstance().get(DatabaseService);
  }

  public async execute(message: Message): Promise<void> {
    if (!message.guildId) return; // Ignore DMs

    const db = this.databaseService.getDb();
    const messageKind: MessageKind = this.getMessageKind(message);
    
    try {
      await db.insert(messageEvents).values({
        guildId: message.guildId,
        channelId: message.channel.id,
        userId: message.author.id,
        isBot: message.author.bot,
        messageKind: messageKind,
      });
    } catch (error) {
      this.logger.error({ err: error }, 'Failed to save message event to database.');
    }
  }

  private getMessageKind(message: Message): MessageKind {
    if (message.stickers.size > 0) return 'sticker';
    if (message.attachments.size > 0) return 'attachment';
    if (message.embeds.length > 0) return 'embed';
    return 'text';
  }
}