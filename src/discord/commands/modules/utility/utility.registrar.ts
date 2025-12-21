import { ICommandConstructor } from '@/discord/commands/core/command.contract';
import { PingCommand } from './commands/ping.command';

export const UtilityCommands: ICommandConstructor[] = [PingCommand];