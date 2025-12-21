import { CommandInteraction, SlashCommandBuilder } from 'discord.js';
import { ICommand } from '@/discord/commands/core/command.contract';

export class PingCommand implements ICommand {
  public readonly data = new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong!');

  public async execute(interaction: CommandInteraction): Promise<void> {
    const sent = await interaction.reply({ content: 'Pinging...'});
    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    await interaction.editReply(`Pong! Roundtrip latency: ${latency}ms.`);
  }
}