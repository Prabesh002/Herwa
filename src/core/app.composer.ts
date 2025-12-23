import { AppContainer } from '@/core/app-container';
import { loadDiscordModule } from '@/discord/discord.module';
import { loadDatabaseModule } from '@/infrastructure/database/database.module';

export function composeApplication(container: AppContainer): void {
  loadDatabaseModule(container);
  loadDiscordModule(container);
}