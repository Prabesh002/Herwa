import fs from 'fs/promises';
import path from 'path';
import { AppContainer } from '@/core/app-container';
import { ConfigService } from '@/infrastructure/config/config.service';
import { createLogger, Logger } from '@/infrastructure/logging/logger';
import { ClickHouseService } from '@/infrastructure/analytics/core/clickhouse.service';
import { AnalyticsClient } from '../core/clickhouse.contract';

const MIGRATIONS_DIR = path.join(process.cwd(), 'migrations-ch');
const MIGRATIONS_TABLE = 'schema_migrations';

class MigrationRunner {
  private readonly logger: Logger;
  private readonly client: AnalyticsClient;

  constructor(client: AnalyticsClient) {
    this.client = client;
    this.logger = createLogger('info').child({ service: 'ClickHouseMigrator' });
  }

  private async getAppliedMigrations(): Promise<Set<string>> {
    await this.client.command({
      query: `
        CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE}
        (
            version String,
            applied_at DateTime DEFAULT now()
        )
        ENGINE = MergeTree()
        ORDER BY version;
      `,
    });

    const resultSet = await this.client.query({
      query: `SELECT version FROM ${MIGRATIONS_TABLE}`,
      format: 'JSONEachRow',
    });

    const versionsResult = await resultSet.json();
    const versions = versionsResult as Array<{ version: string }>;
    const versionStrings = versions.map((row) => row.version);
    return new Set(versionStrings);
  }

  private async getPendingMigrations(applied: Set<string>): Promise<string[]> {
    const allFiles = await fs.readdir(MIGRATIONS_DIR);
    const sqlFiles = allFiles
      .filter((file) => file.endsWith('.sql'))
      .sort();
    return sqlFiles.filter((file) => !applied.has(file));
  }

  private async applyMigration(fileName: string): Promise<void> {
    this.logger.info(`Applying migration: ${fileName}...`);
    const filePath = path.join(MIGRATIONS_DIR, fileName);
    const sql = await fs.readFile(filePath, 'utf-8');

    const statements = sql
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean);

    for (const statement of statements) {
      await this.client.command({
        query: statement,
        clickhouse_settings: {
          wait_end_of_query: 1,
        },
      });
    }

    await this.client.insert({
      table: MIGRATIONS_TABLE,
      values: [{ version: fileName }],
      format: 'JSONEachRow',
    });

    this.logger.info(`Successfully applied migration: ${fileName}`);
  }

  public async run(): Promise<void> {
    this.logger.info('Starting ClickHouse database migration process...');

    const applied = await this.getAppliedMigrations();
    const pending = await this.getPendingMigrations(applied);

    if (pending.length === 0) {
      this.logger.info('Database is already up to date.');
      return;
    }

    this.logger.info(`Found ${pending.length} pending migration(s).`);

    for (const migrationFile of pending) {
      await this.applyMigration(migrationFile);
    }

    this.logger.info('All pending migrations have been applied.');
  }
}

const main = async () => {
  const container = AppContainer.getInstance();
  container.register(ConfigService, new ConfigService());
  const clickhouseService = new ClickHouseService();
  await clickhouseService.connect();

  const runner = new MigrationRunner(clickhouseService.getClient());
  await runner.run();
};

main()
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });