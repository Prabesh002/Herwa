import { AppContainer } from '@/core/app-container';
import { EntitlementService } from './entitlement.service';

export function loadServicesModule(container: AppContainer): void {
  container.register(EntitlementService, new EntitlementService());
}