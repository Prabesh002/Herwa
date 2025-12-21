import { AppContainer } from '@/core/app-container';
import { DiscordClientService } from '@/discord/core/discord-client.service';
import { EventRegistryService } from '@/discord/events/event-registry.service';
import { createLogger, Logger } from '@/infrastructure/logging/logger';
import { ConfigService } from '@/infrastructure/config/config.service';
import { IEventHandler } from '@/discord/events/core/event.contract';

export class EventHandlingService {
  private readonly logger: Logger;
  private readonly clientService: DiscordClientService;
  private readonly eventRegistry: EventRegistryService;

  constructor() {
    this.clientService = AppContainer.getInstance().get(DiscordClientService);
    this.eventRegistry = AppContainer.getInstance().get(EventRegistryService);

    const config = AppContainer.getInstance().get(ConfigService).get();
    this.logger = createLogger(config.logLevel).child({ service: 'EventHandler' });
  }

  public start(): void {
    const client = this.clientService.getClient();
    const eventNames = this.eventRegistry.getRegisteredEventNames();

    for (const eventName of eventNames) {
      client.on(eventName, async (...args: any[]) => {
        const handlers = this.eventRegistry.get(eventName);
        for (const handler of handlers) {
          try {
            await (handler as IEventHandler<any>).execute(...args);
          } catch (error) {
            this.logger.error({ err: error, event: eventName }, 'Error executing event handler');
          }
        }
      });
    }
    
    this.logger.info(`Event handler started and listening for ${eventNames.length} event types.`);
  }
}