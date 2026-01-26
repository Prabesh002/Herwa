import { Events, Message } from 'discord.js';
import { IEventHandler } from '@/discord/events/core/event.contract';
import { createLogger, Logger } from '@/infrastructure/logging/logger';
import { AppContainer } from '@/core/app-container';
import { MessagePersistenceService } from '@/infrastructure/database/services/analytics/message-persistence.service';
import { MessageKind } from '@/infrastructure/database/schema';

export class MessageCreateHandler implements IEventHandler<Events.MessageCreate> {
  public readonly eventName = Events.MessageCreate;
  private readonly logger: Logger;
  private readonly persistence: MessagePersistenceService;

  constructor() {
    this.logger = createLogger('info').child({ handler: 'MessageCreate' });
    this.persistence = AppContainer.getInstance().get(MessagePersistenceService);
  }

  public async execute(message: Message): Promise<void> {
    if (!message.guildId) return; // Ignore DMs

    try {
      await this.persistence.recordMessageCreate({
        guildId: message.guildId,
        channelId: message.channel.id,
        userId: message.author.id,
        isBot: message.author.bot,
        messageKind: this.getMessageKind(message),
      });
    } catch (error) {
      this.logger.error({ err: error }, 'Failed to process message create event.');
    }
  }

  private getMessageKind(message: Message): MessageKind {
    if (message.stickers.size > 0) return 'sticker';
    if (message.attachments.size > 0) return 'attachment';
    if (message.embeds.length > 0) return 'embed';
    return 'text';
  }
}