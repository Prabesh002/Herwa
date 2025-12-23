import { CommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { ICommand } from '@/discord/commands/core/command.contract';
import { AppContainer } from '@/core/app-container';
import { StatsProvider } from '@/discord/providers/stats.provider';

export class ServerStatsCommand implements ICommand {
  public readonly data = new SlashCommandBuilder()
    .setName('server-stats')
    .setDescription('Displays high-level statistics for this server.');

  private readonly statsProvider: StatsProvider;

  constructor() {
    this.statsProvider = AppContainer.getInstance().get(StatsProvider);
  }

  public async execute(interaction: CommandInteraction): Promise<void> {
    if (!interaction.guildId) {
      await interaction.reply({ content: 'This command can only be used in a server.', flags: ['Ephemeral'] });
      return;
    }
    
    await interaction.deferReply();

    const stats = await this.statsProvider.getServerStats(interaction.guildId);
    const voiceHours = (stats.totalVoiceSeconds / 3600).toFixed(2);

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle(`📊 Statistics for ${interaction.guild?.name}`)
      .addFields(
        { name: 'Total Messages Tracked', value: stats.messageCount.toString(), inline: true },
        { name: 'Total Members Joined', value: stats.joinCount.toString(), inline: true },
        { name: 'Total Members Left', value: stats.leaveCount.toString(), inline: true },
        { name: 'Total Voice Chat Time', value: `${voiceHours} hours`, inline: true },
      )
      .setFooter({ text: 'Data collected since bot was added.' })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }
}