import { CommandRegistryService } from '@/discord/commands/command-registry.service';
import { UtilityCommands } from '@/discord/commands/modules/utility/utility.registrar';

export function loadCommands(registry: CommandRegistryService): void {
  registry.register(UtilityCommands);
}