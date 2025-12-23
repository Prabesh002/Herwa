import { CommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { ICommand } from '@/discord/commands/core/command.contract';
import { AppContainer } from '@/core/app-container';
import { DatabaseService } from '@/infrastructure/database/core/database.service';
import { sql, eq, count, sum } from 'drizzle-orm';
import * as schema from '@/infrastructure/database/schema';

export class ServerStatsCommand implements ICommand {
  public readonly data = new SlashCommandBuilder()
    .setName('server-stats')
    .setDescription('Displays high-level statistics for this server.');

  private readonly database: DatabaseService;

  constructor() {
    this.database = AppContainer.getInstance().get(DatabaseService);
  }

  public async execute(interaction: CommandInteraction): Promise<void> {
    if (!interaction.guildId) {
      await interaction.reply({ content: 'This command can only be used in a server.', flags: ['Ephemeral'] });
      return;
    }
    
    await interaction.deferReply();

    const db = this.database.getDb();
    const guildId = interaction.guildId;

    //todo, later move to another layer so we dont query directly here..

    const [messageCountResult] = await db
      .select({ value: count() })
      .from(schema.messageEvents)
      .where(eq(schema.messageEvents.guildId, guildId));

    const [joinCountResult] = await db
      .select({ value: count() })
      .from(schema.memberLifecycleEvents)
      .where(sql`${schema.memberLifecycleEvents.guildId} = ${guildId} AND ${schema.memberLifecycleEvents.eventType} = 'JOIN'`);
      
    const [leaveCountResult] = await db
      .select({ value: count() })
      .from(schema.memberLifecycleEvents)
      .where(sql`${schema.memberLifecycleEvents.guildId} = ${guildId} AND ${schema.memberLifecycleEvents.eventType} = 'LEAVE'`);
      
    const [voiceTimeResult] = await db
      .select({ value: sum(schema.voiceSessions.durationSeconds) })
      .from(schema.voiceSessions)
      .where(eq(schema.voiceSessions.guildId, guildId));

    const totalVoiceSeconds = Number(voiceTimeResult?.value) || 0;
    const voiceHours = (totalVoiceSeconds / 3600).toFixed(2);

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle(`📊 Statistics for ${interaction.guild?.name}`)
      .addFields(
        { name: 'Total Messages Tracked', value: (messageCountResult?.value || 0).toString(), inline: true },
        { name: 'Total Members Joined', value: (joinCountResult?.value || 0).toString(), inline: true },
        { name: 'Total Members Left', value: (leaveCountResult?.value || 0).toString(), inline: true },
        { name: 'Total Voice Chat Time', value: `${voiceHours} hours`, inline: true },
      )
      .setFooter({ text: 'Data collected since bot was added.' })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }
}