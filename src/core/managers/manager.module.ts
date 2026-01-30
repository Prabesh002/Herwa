import { AppContainer } from '@/core/app-container';
import { CatalogManager } from '@/core/managers/catalog.manager';
import { EntitlementManager } from '@/core/managers/entitlement.manager';
import { SubscriptionManager } from '@/core/managers/subscription.manager';
import { UsageManager } from '@/core/managers/usage.manager';

export function loadManagerModule(container: AppContainer): void {
  container.register(CatalogManager, new CatalogManager());
  container.register(UsageManager, new UsageManager());
  container.register(EntitlementManager, new EntitlementManager());
  container.register(SubscriptionManager, new SubscriptionManager());
}