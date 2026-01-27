import { CommandInteraction, SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } from 'discord.js';
import { ICommand } from '@/discord/commands/core/command.contract';
import { AppContainer } from '@/core/app-container';
import { StatsProvider } from '@/discord/providers/stats.provider';
import { ChartGeneratorService } from '@/discord/services/chart-generator.service';

export class ServerStatsCommand implements ICommand {
  public readonly data = new SlashCommandBuilder()
    .setName('server-stats')
    .setDescription('Displays high-level statistics for this server.');

  private readonly statsProvider: StatsProvider;
  private readonly chartGenerator: ChartGeneratorService;

  constructor() {
    this.statsProvider = AppContainer.getInstance().get(StatsProvider);
    this.chartGenerator = AppContainer.getInstance().get(ChartGeneratorService);
  }

  public async execute(interaction: CommandInteraction): Promise<void> {
    if (!interaction.guildId) return;
    
    await interaction.deferReply();

    const [stats, dailyData] = await Promise.all([
      this.statsProvider.getServerStats(interaction.guildId),
      this.statsProvider.getDailyMessageActivity(interaction.guildId)
    ]);

    const chartBuffer = await this.chartGenerator.generateActivityChart(dailyData);
    const attachment = new AttachmentBuilder(chartBuffer, { name: 'activity.png' });

    const voiceHours = (stats.totalVoiceSeconds / 3600).toFixed(2);

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle(`📊 Statistics for ${interaction.guild?.name}`)
      .addFields(
        { name: 'Total Messages', value: stats.messageCount.toString(), inline: true },
        { name: 'Total Members', value: (stats.joinCount - stats.leaveCount).toString(), inline: true },
        { name: 'Voice Time', value: `${voiceHours}h`, inline: true },
      )
      .setImage('attachment://activity.png')
      .setTimestamp();

    await interaction.editReply({ embeds: [embed], files: [attachment] });
  }
}