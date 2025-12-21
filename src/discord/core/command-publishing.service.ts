import { REST, Routes } from 'discord.js';
import { AppContainer } from '@/core/app-container';
import { ConfigService } from '@/infrastructure/config/config.service';
import { CommandRegistryService } from '@/discord/commands/command-registry.service';
import { createLogger, Logger } from '@/infrastructure/logging/logger';

export class CommandPublishingService {
  private readonly logger: Logger;
  private readonly configService: ConfigService;
  private readonly commandRegistry: CommandRegistryService;

  constructor() {
    this.configService = AppContainer.getInstance().get(ConfigService);
    this.commandRegistry = AppContainer.getInstance().get(CommandRegistryService);
    
    const config = this.configService.get();
    this.logger = createLogger(config.logLevel).child({ service: 'CommandPublisher' });
  }

  public async publish(): Promise<void> {
    const config = this.configService.get();
    const rest = new REST({ version: '10' }).setToken(config.discordToken);

    const commandData = this.commandRegistry
      .getAll()
      .map((command) => command.data.toJSON());

    this.logger.info(`Started refreshing ${commandData.length} application (/) commands.`);

    try {
      await rest.put(
        Routes.applicationCommands(config.discordClientId),
        { body: commandData },
      );
      this.logger.info(`Successfully reloaded application (/) commands.`);
    } catch (error) {
      this.logger.error({ err: error }, 'Failed to refresh application commands.');
    }
  }
}