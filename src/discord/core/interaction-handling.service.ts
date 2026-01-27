import { Events, Interaction, MessageFlags, GuildMemberRoleManager } from 'discord.js';
import { AppContainer } from '@/core/app-container';
import { DiscordClientService } from '@/discord/core/discord-client.service';
import { CommandRegistryService } from '@/discord/commands/command-registry.service';
import { createLogger, Logger } from '@/infrastructure/logging/logger';
import { ConfigService } from '@/infrastructure/config/config.service';
import { EntitlementManager } from '@/core/managers/entitlement.manager';

export class InteractionHandlingService {
  private readonly logger: Logger;
  private readonly clientService: DiscordClientService;
  private readonly commandRegistry: CommandRegistryService;
  private readonly entitlementManager: EntitlementManager;

  constructor() {
    const container = AppContainer.getInstance();
    this.clientService = container.get(DiscordClientService);
    this.commandRegistry = container.get(CommandRegistryService);
    this.entitlementManager = container.get(EntitlementManager);
    
    const config = container.get(ConfigService).get();
    this.logger = createLogger(config.logLevel).child({ service: 'InteractionHandler' });
  }

  public start(): void {
    const client = this.clientService.getClient();
    client.on(Events.InteractionCreate, this.handleInteraction.bind(this));
    this.logger.info('Interaction handler started with Entitlement Guardrails.');
  }

  private async handleInteraction(interaction: Interaction): Promise<void> {
    if (!interaction.isChatInputCommand()) return;

    const command = this.commandRegistry.get(interaction.commandName);
    if (!command) {
      this.logger.warn(`No command matching "${interaction.commandName}" was found.`);
      await interaction.reply({
        content: 'Unknown command.',
        flags: [MessageFlags.Ephemeral],
      });
      return;
    }

    if (interaction.guildId) {
      const memberRoles = interaction.member?.roles as GuildMemberRoleManager;
      const roleIds = Array.from(memberRoles.cache.keys());

      const entitlement = await this.entitlementManager.checkEntitlement({
        guildId: interaction.guildId,
        userId: interaction.user.id,
        commandName: interaction.commandName,
        channelId: interaction.channelId,
        memberRoles: roleIds,
      });

      if (!entitlement.isEntitled) {
        this.logger.info({ 
          guildId: interaction.guildId, 
          command: interaction.commandName, 
          reason: entitlement.reasonCode 
        }, 'Command execution denied by Entitlement Manager.');

        await interaction.reply({
          content: entitlement.message || 'You do not have permission to use this command.',
          flags: [MessageFlags.Ephemeral],
        });
        return;
      }
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      this.logger.error({ err: error, command: interaction.commandName }, 'Error executing command');
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: 'There was an error while executing this command!', flags: [MessageFlags.Ephemeral] });
      } else {
        await interaction.reply({ content: 'There was an error while executing this command!', flags: [MessageFlags.Ephemeral] });
      }
    }
  }
}