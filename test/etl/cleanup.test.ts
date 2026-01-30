import { describe, test, expect, beforeAll, beforeEach } from 'bun:test';
import { AppContainer } from '@/core/app-container';
import { DatabaseService } from '@/infrastructure/database/core/database.service';
import { ConfigService } from '@/infrastructure/config/config.service';
import { PostgresCleanupTask } from '@/infrastructure/analytics/etl/tasks/postgres-cleanup.task';
import { messageEvents } from '@/infrastructure/database/schema';
import { TestBootstrap } from '@/test/utils/bootstrap';
import { count } from 'drizzle-orm';

describe('ETL Cleanup Logic (The Janitor)', () => {
  let db: DatabaseService;
  let config: ConfigService;
  let task: PostgresCleanupTask;

  beforeAll(async () => {
    await TestBootstrap.getInstance().initialize();
    const container = AppContainer.getInstance();
    db = container.get(DatabaseService);
    config = container.get(ConfigService);
    task = new PostgresCleanupTask(db, config);
  });

  beforeEach(async () => {
    await TestBootstrap.getInstance().cleanupAnalytics();
  });

  test('Janitor: Should only delete old AND synced records', async () => {
    const pg = db.getDb();
    const retentionHours = config.get().postgresRetentionHours;
    
    const oldDate = new Date();
    oldDate.setHours(oldDate.getHours() - (retentionHours + 1));

    const newDate = new Date();

    await pg.insert(messageEvents).values([
      {
        userId: 'old-synced', // Should be deleted
        guildId: 'g1', channelId: 'c1', messageKind: 'text', isBot: false,
        createdAt: oldDate,
        chIngestedAt: new Date()
      },
      {
        userId: 'old-unsynced', // Should NOT be deleted (Handshake missing)
        guildId: 'g1', channelId: 'c1', messageKind: 'text', isBot: false,
        createdAt: oldDate,
        chIngestedAt: null
      },
      {
        userId: 'new-synced', // Should NOT be deleted (Too recent)
        guildId: 'g1', channelId: 'c1', messageKind: 'text', isBot: false,
        createdAt: newDate,
        chIngestedAt: new Date()
      }
    ]);

    await task.run();

    const rows = await pg.select().from(messageEvents);
    
    expect(rows.length).toBe(2);
    expect(rows.some(r => r.userId === 'old-unsynced')).toBe(true);
    expect(rows.some(r => r.userId === 'new-synced')).toBe(true);
    expect(rows.some(r => r.userId === 'old-synced')).toBe(false);
  });
});