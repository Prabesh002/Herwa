import { Events, Guild } from 'discord.js';
import { IEventHandler } from '@/discord/events/core/event.contract';
import { AppContainer } from '@/core/app-container';
import { EntitlementManager } from '@/core/managers/entitlement.manager';
import { createLogger, Logger } from '@/infrastructure/logging/logger';

export class GuildCreateHandler implements IEventHandler<Events.GuildCreate> {
  public readonly eventName = Events.GuildCreate;
  private readonly entitlementManager: EntitlementManager;
  private readonly logger: Logger;

  constructor() {
    this.entitlementManager = AppContainer.getInstance().get(EntitlementManager);
    this.logger = createLogger('info').child({ handler: 'GuildCreate' });
  }

  public async execute(guild: Guild): Promise<void> {
    try {
      await this.entitlementManager.initializeGuild(guild.id);
      this.logger.info({ guildId: guild.id, guildName: guild.name }, 'New guild initialized with default tier.');
    } catch (error) {
      this.logger.error({ err: error, guildId: guild.id }, 'Failed to initialize new guild.');
    }
  }
}