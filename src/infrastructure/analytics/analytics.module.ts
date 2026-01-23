import { AppContainer } from '@/core/app-container';
import { ClickHouseService } from '@/infrastructure/analytics/core/clickhouse.service';

export function loadAnalyticsModule(container: AppContainer): void {
  container.register(ClickHouseService, new ClickHouseService());
}