import { AppContainer } from '@/core/app-container';
import { ConfigService } from '@/infrastructure/config/config.service';
import { ClickHouseService } from '@/infrastructure/analytics/core/clickhouse.service';
import { StatsRepository } from '@/infrastructure/analytics/repositories/stats.repository';
import fs from 'fs/promises';
import path from 'path';

export class TestBootstrap {
  private static instance: TestBootstrap;
  private clickhouse: ClickHouseService | null = null;

  private constructor() {}

  public static getInstance(): TestBootstrap {
    if (!TestBootstrap.instance) {
      TestBootstrap.instance = new TestBootstrap();
    }
    return TestBootstrap.instance;
  }

  public async initialize(): Promise<void> {
    const container = AppContainer.getInstance();
    
    try {
      container.get(ConfigService);
    } catch {
      container.register(ConfigService, new ConfigService());
    }

    if (!this.clickhouse) {
      this.clickhouse = new ClickHouseService();
      await this.clickhouse.connect(); 
      try {
        container.register(ClickHouseService, this.clickhouse);
      } catch {}
      
      try {
        container.register(StatsRepository, new StatsRepository());
      } catch {}

      await this.applyClickHouseMigrations();
    }
  }

  private async applyClickHouseMigrations(): Promise<void> {
    if (!this.clickhouse) throw new Error('ClickHouse not initialized');
    
    const client = this.clickhouse.getClient();
    const migrationsDir = path.join(process.cwd(), 'migrations-ch');
    
    try {
      const sql = await fs.readFile(path.join(migrationsDir, '0000_initial_schema.sql'), 'utf-8');
      const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
      
      for (const statement of statements) {
        await client.command({ query: statement });
      }
    } catch (error) {
      console.error('Failed to apply ClickHouse migrations in test:', error);
      throw error;
    }
  }
}