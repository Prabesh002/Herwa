import { IEventHandler, IEventHandlerConstructor } from '@/discord/events/core/event.contract';
import { Logger, createLogger } from '@/infrastructure/logging/logger';
import { AppContainer } from '@/core/app-container';
import { ConfigService } from '@/infrastructure/config/config.service';

export class EventRegistryService {
  private readonly handlers = new Map<string, IEventHandler[]>();
  private readonly logger: Logger;

  constructor() {
    const config = AppContainer.getInstance().get(ConfigService).get();
    this.logger = createLogger(config.logLevel).child({ service: 'EventRegistry' });
  }

  public register(handlerConstructors: IEventHandlerConstructor[]): void {
    for (const Handler of handlerConstructors) {
      const handlerInstance = new Handler();
      const { eventName } = handlerInstance;

      const existingHandlers = this.handlers.get(eventName) || [];
      existingHandlers.push(handlerInstance);
      this.handlers.set(eventName, existingHandlers);
      
      this.logger.debug(`Registered handler for event: ${eventName}`);
    }
  }
  
  public get(eventName: string): IEventHandler[] {
    return this.handlers.get(eventName) || [];
  }

  public getRegisteredEventNames(): string[] {
    return Array.from(this.handlers.keys());
  }
}