import { AppContainer } from '@/core/app-container';
import { loadDiscordModule } from '@/discord/discord.module';
import { loadDatabaseModule } from '@/infrastructure/database/database.module';
import { loadAnalyticsModule } from '@/infrastructure/analytics/analytics.module';
import { loadRedisModule } from '@/infrastructure/redis/redis.module';
import { loadManagerModule } from '@/core/managers/manager.module';
import { loadServicesModule } from './services/service.module';

export function composeApplication(container: AppContainer): void {
  loadDatabaseModule(container);
  loadAnalyticsModule(container);
  loadRedisModule(container);
  loadManagerModule(container);
  loadServicesModule(container);
  loadDiscordModule(container);
}