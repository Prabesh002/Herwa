import { ICommand, ICommandConstructor } from '@/discord/commands/core/command.contract';
import { Logger, createLogger } from '@/infrastructure/logging/logger';
import { AppContainer } from '@/core/app-container';
import { ConfigService } from '@/infrastructure/config/config.service';

export class CommandRegistryService {
  private readonly commands = new Map<string, ICommand>();
  private readonly logger: Logger;

  constructor() {
    const config = AppContainer.getInstance().get(ConfigService).get();
    this.logger = createLogger(config.logLevel).child({ service: 'CommandRegistry' });
  }

  public register(commandConstructors: ICommandConstructor[]): void {
    for (const Command of commandConstructors) {
      const commandInstance = new Command();
      const commandName = commandInstance.data.name;

      if (this.commands.has(commandName)) {
        this.logger.warn(`Command "${commandName}" is already registered. Overwriting.`);
      }

      this.commands.set(commandName, commandInstance);
      this.logger.debug(`Registered command: ${commandName}`);
    }
  }

  public get(commandName: string): ICommand | undefined {
    return this.commands.get(commandName);
  }

  public getAll(): ICommand[] {
    return Array.from(this.commands.values());
  }
}