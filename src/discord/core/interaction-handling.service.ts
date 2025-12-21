import { Events, Interaction } from 'discord.js';
import { AppContainer } from '@/core/app-container';
import { DiscordClientService } from '@/discord/core/discord-client.service';
import { CommandRegistryService } from '@/discord/commands/command-registry.service';
import { createLogger, Logger } from '@/infrastructure/logging/logger';
import { ConfigService } from '@/infrastructure/config/config.service';

export class InteractionHandlingService {
  private readonly logger: Logger;
  private readonly clientService: DiscordClientService;
  private readonly commandRegistry: CommandRegistryService;

  constructor() {
    this.clientService = AppContainer.getInstance().get(DiscordClientService);
    this.commandRegistry = AppContainer.getInstance().get(CommandRegistryService);
    
    const config = AppContainer.getInstance().get(ConfigService).get();
    this.logger = createLogger(config.logLevel).child({ service: 'InteractionHandler' });
  }

  public start(): void {
    const client = this.clientService.getClient();
    client.on(Events.InteractionCreate, this.handleInteraction.bind(this));
    this.logger.info('Interaction handler started and listening for events.');
  }

  private async handleInteraction(interaction: Interaction): Promise<void> {
    if (!interaction.isChatInputCommand()) return;

    const command = this.commandRegistry.get(interaction.commandName);
    if (!command) {
      this.logger.warn(`No command matching "${interaction.commandName}" was found.`);
      await interaction.reply({
        content: 'Unknown command.',
        ephemeral: true,
      });
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      this.logger.error({ err: error, command: interaction.commandName }, 'Error executing command');
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
      } else {
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
      }
    }
  }
}