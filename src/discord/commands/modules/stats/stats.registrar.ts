import { ICommandConstructor } from '@/discord/commands/core/command.contract';
import { ServerStatsCommand } from './commands/server-stats.command';

export const StatsCommands: ICommandConstructor[] = [
  ServerStatsCommand,
];