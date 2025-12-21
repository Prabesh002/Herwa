import { Events, Message } from 'discord.js';
import { IEventHandler } from '@/discord/events/core/event.contract';
import { createLogger, Logger } from '@/infrastructure/logging/logger';

export class MessageLoggerHandler implements IEventHandler<Events.MessageCreate> {
  public readonly eventName = Events.MessageCreate;
  private readonly logger: Logger;

  constructor() {
    this.logger = createLogger('info').child({ handler: 'MessageLogger' });
  }

  public async execute(message: Message): Promise<void> {
    if (message.author.bot) return;

    this.logger.info(
      {
        user: { id: message.author.id, name: message.author.username },
        message: { id: message.id, content: message.content },
        channel: { id: message.channel.id },
        guild: { id: message.guild?.id },
      },
      'New message created',
    );
  }
}