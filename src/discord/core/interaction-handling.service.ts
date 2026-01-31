import { Events, Interaction, MessageFlags, GuildMemberRoleManager } from 'discord.js';
import { AppContainer } from '@/core/app-container';
import { DiscordClientService } from '@/discord/core/discord-client.service';
import { CommandRegistryService } from '@/discord/commands/command-registry.service';
import { createLogger, Logger } from '@/infrastructure/logging/logger';
import { ConfigService } from '@/infrastructure/config/config.service';
import { EntitlementManager } from '@/core/managers/entitlement.manager';
import { EntitlementService } from '@/core/services/entitlement.service';
import { UsageService } from '@/core/services/usage.service';

export class InteractionHandlingService {
  private readonly logger: Logger;
  private readonly clientService: DiscordClientService;
  private readonly commandRegistry: CommandRegistryService;
  private readonly entitlementManager: EntitlementManager;
  private readonly entitlementService: EntitlementService;
  private readonly usageService: UsageService;

  constructor() {
    const container = AppContainer.getInstance();
    this.clientService = container.get(DiscordClientService);
    this.commandRegistry = container.get(CommandRegistryService);
    this.entitlementManager = container.get(EntitlementManager);
    this.entitlementService = container.get(EntitlementService);
    this.usageService = container.get(UsageService);
    
    const config = container.get(ConfigService).get();
    this.logger = createLogger(config.logLevel).child({ service: 'InteractionHandler' });
  }

  public start(): void {
    const client = this.clientService.getClient();
    client.on(Events.InteractionCreate, this.handleInteraction.bind(this));
    this.logger.info('Interaction handler started.');
  }

  private async handleInteraction(interaction: Interaction): Promise<void> {
    if (!interaction.isChatInputCommand()) return;

    const command = this.commandRegistry.get(interaction.commandName);
    if (!command) {
      await interaction.reply({ content: 'Unknown command.', flags: [MessageFlags.Ephemeral] });
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
        await interaction.reply({
          content: entitlement.message || 'Access denied.',
          flags: [MessageFlags.Ephemeral],
        });
        return;
      }
    }

    try {
      await command.execute(interaction);
      
      if (interaction.guildId) {
        const globalCommands = await this.entitlementService.getGlobalCommands();
        const cmdMeta = globalCommands.get(interaction.commandName);
        const entitlements = await this.entitlementService.getGuildEntitlements(interaction.guildId);
        
        if (cmdMeta && entitlements) {
          const quota = entitlements.tierFeatures.get(cmdMeta.featureCode);
          if (quota && quota.resetPeriod) {
            await this.usageService.incrementUsage(
              interaction.guildId, 
              cmdMeta.featureId, 
              quota.resetPeriod
            );
          }
        }
      }
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