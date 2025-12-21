import { AppContainer } from '@/core/app-container';
import { loadDiscordModule } from '@/discord/discord.module';

export function composeApplication(container: AppContainer): void {
  loadDiscordModule(container);
}