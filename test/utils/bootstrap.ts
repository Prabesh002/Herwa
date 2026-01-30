import { AppContainer } from '@/core/app-container';
import { ConfigService } from '@/infrastructure/config/config.service';
import { ClickHouseService } from '@/infrastructure/analytics/core/clickhouse.service';
import { DatabaseService } from '@/infrastructure/database/core/database.service';
import { CatalogManager } from '@/core/managers/catalog.manager';
import { loadDatabaseModule } from '@/infrastructure/database/database.module';
import { loadAnalyticsModule } from '@/infrastructure/analytics/analytics.module';
import { loadManagerModule } from '@/core/managers/manager.module';

import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const asyncExec = promisify(exec);

export class TestBootstrap {
  private static instance: TestBootstrap;
  private static initPromise: Promise<void> | null = null;

  private constructor() {}

  public static getInstance(): TestBootstrap {
    if (!TestBootstrap.instance) {
      TestBootstrap.instance = new TestBootstrap();
    }
    return TestBootstrap.instance;
  }

  public async initialize(): Promise<void> {
    if (TestBootstrap.initPromise) {
      return TestBootstrap.initPromise;
    }

    TestBootstrap.initPromise = (async () => {
      const container = AppContainer.getInstance();

      if (!container.has(ConfigService)) {
        container.register(ConfigService, new ConfigService());
      }

      const config = container.get(ConfigService).get();
      await this.waitForPostgres(config.databaseUrl);

      if (!container.has(DatabaseService)) {
        loadDatabaseModule(container);
      }

      if (!container.has(ClickHouseService)) {
        loadAnalyticsModule(container);
        await container.get(ClickHouseService).connect();
      }

      if (!container.has(CatalogManager)) {
        loadManagerModule(container);
      }

      await asyncExec('bun run db:migrate');
      await this.applyClickHouseMigrations();
      await this.seedCatalog();
    })();

    return TestBootstrap.initPromise;
  }

  private async waitForPostgres(url: string, retries = 15): Promise<void> {
    const { Pool } = await import('pg');
    const pool = new Pool({ connectionString: url });
    
    for (let i = 0; i < retries; i++) {
      try {
        const client = await pool.connect();
        client.release();
        await pool.end();
        return;
      } catch (err) {
        await new Promise(res => setTimeout(res, 1000));
      }
    }
    throw new Error('Postgres not ready after retries');
  }

  private async applyClickHouseMigrations(): Promise<void> {
    const clickhouse = AppContainer.getInstance().get(ClickHouseService);
    const client = clickhouse.getClient();
    const migrationsDir = path.join(process.cwd(), 'migrations-ch');
    const files = await fs.readdir(migrationsDir);
    
    const sqlFiles = files
      .filter(f => f.endsWith('.sql'))
      .sort((a, b) => parseInt(a.split('_')[0]) - parseInt(b.split('_')[0]));

    for (const fileName of sqlFiles) {
      const sql = await fs.readFile(path.join(migrationsDir, fileName), 'utf-8');
      const statements = sql.split(';').map(s => s.trim()).filter(Boolean);
      for (const statement of statements) {
        await client.command({ query: statement });
      }
    }
  }

  private async seedCatalog(): Promise<void> {
    const catalog = AppContainer.getInstance().get(CatalogManager);
    try {
      await catalog.createTier({ name: 'Free', priceMonthly: 0, isDefault: true, description: '' });
      await catalog.createTier({ name: 'Pro', priceMonthly: 500, isDefault: false, description: '' });
      await catalog.createFeature({ code: 'CORE', name: 'Core', description: '' });
      await catalog.createFeature({ code: 'STATS', name: 'Stats', description: '' });
      await catalog.linkFeatureToTier({ tierName: 'Free', featureCode: 'CORE' });
      await catalog.linkFeatureToTier({ tierName: 'Pro', featureCode: 'CORE' });
      await catalog.linkFeatureToTier({ tierName: 'Pro', featureCode: 'STATS' });
      await catalog.registerCommand({ commandName: 'ping', featureCode: 'CORE' });
      await catalog.registerCommand({ commandName: 'server-stats', featureCode: 'STATS' });
    } catch {}
  }

  public async cleanupPostgres(): Promise<void> {
    const db = AppContainer.getInstance().get(DatabaseService).getDb();
    const tables = [
      'payments',
      'guild_subscriptions',
      'guild_command_permissions',
      'guild_feature_overrides',
      'guild_settings'
    ];
    for (const table of tables) {
      await db.execute(`TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE;`);
    }
  }

  public async cleanupAnalytics(): Promise<void> {
    const db = AppContainer.getInstance().get(DatabaseService).getDb();
    const tables = ['message_events', 'member_lifecycle_events', 'voice_sessions'];
    for (const table of tables) {
      await db.execute(`TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE;`);
    }
  }
}