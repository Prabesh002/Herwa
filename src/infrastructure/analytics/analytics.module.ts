import { AppContainer } from '@/core/app-container';
import { ClickHouseService } from '@/infrastructure/analytics/core/clickhouse.service';
import { StatsRepository } from '@/infrastructure/analytics/repositories/stats.repository';

export function loadAnalyticsModule(container: AppContainer): void {
  container.register(ClickHouseService, new ClickHouseService());
  container.register(StatsRepository, new StatsRepository());
}