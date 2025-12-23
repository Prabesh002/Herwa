import { AppContainer } from '@/core/app-container';
import { DatabaseService } from '@/infrastructure/database/core/database.service';

export function loadDatabaseModule(container: AppContainer): void {
  container.register(DatabaseService, new DatabaseService());
}