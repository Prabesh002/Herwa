import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { AppContainer } from '@/core/app-container';
import { ConfigService } from '@/infrastructure/config/config.service';
import * as schema from '@/infrastructure/database/schema';

export class DatabaseService {
  private readonly db: NodePgDatabase<typeof schema>;
  private readonly pool: Pool;

  constructor() {
    const config = AppContainer.getInstance().get(ConfigService).get();
    this.pool = new Pool({
      connectionString: config.databaseUrl,
    });
    this.db = drizzle(this.pool, { schema });
  }

  public getDb(): NodePgDatabase<typeof schema> {
    return this.db;
  }

  public async disconnect(): Promise<void> {
    await this.pool.end();
  }
}