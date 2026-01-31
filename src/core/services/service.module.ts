import { AppContainer } from '@/core/app-container';
import { EntitlementService } from './entitlement.service';
import { UsageService } from './usage.service';

export function loadServicesModule(container: AppContainer): void {
  container.register(EntitlementService, new EntitlementService());
  container.register(UsageService, new UsageService());
}