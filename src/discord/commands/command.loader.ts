import { CommandRegistryService } from '@/discord/commands/command-registry.service';
import { UtilityCommands } from '@/discord/commands/modules/utility/utility.registrar';
import { StatsCommands } from '@/discord/commands/modules/stats/stats.registrar';

export function loadCommands(registry: CommandRegistryService): void {
  registry.register(UtilityCommands);
  registry.register(StatsCommands);
}