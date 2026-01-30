import { describe, test, expect, beforeAll, beforeEach } from 'bun:test';
import { AppContainer } from '@/core/app-container';
import { DatabaseService } from '@/infrastructure/database/core/database.service';
import { ClickHouseService } from '@/infrastructure/analytics/core/clickhouse.service';
import { ConfigService } from '@/infrastructure/config/config.service';
import { MessageSyncTask } from '@/infrastructure/analytics/etl/tasks/message-sync.task';
import { messageEvents } from '@/infrastructure/database/schema';
import { TestBootstrap } from '@/test/utils/bootstrap';
import { isNull, isNotNull, count } from 'drizzle-orm';

describe('ETL Sync Logic', () => {
  let db: DatabaseService;
  let ch: ClickHouseService;
  let realConfig: ConfigService;

  beforeAll(async () => {
    await TestBootstrap.getInstance().initialize();
    const container = AppContainer.getInstance();
    db = container.get(DatabaseService);
    ch = container.get(ClickHouseService);
    realConfig = container.get(ConfigService);
  });

  beforeEach(async () => {
    await TestBootstrap.getInstance().cleanupAnalytics();
  });

  test('Drain Loop: Should process multiple chunks if total records exceed batch size', async () => {
    const pg = db.getDb();
    const totalToInsert = 12;
    const mockBatchSize = 5;

    const mockConfig = {
      get: () => ({
        ...realConfig.get(),
        analyticsBatchSize: mockBatchSize
      })
    } as ConfigService;

    const task = new MessageSyncTask(db, ch, mockConfig);

    const rows = Array.from({ length: totalToInsert }).map((_, i) => ({
      guildId: 'batch-test-guild',
      channelId: 'c1',
      userId: `u${i}`,
      messageKind: 'text' as const,
      isBot: false,
    }));

    await pg.insert(messageEvents).values(rows);

    await task.run();

    const [syncedCount] = await pg
      .select({ value: count() })
      .from(messageEvents)
      .where(isNotNull(messageEvents.chIngestedAt));

    expect(Number(syncedCount.value)).toBe(totalToInsert);
  });

  test('Exclusion: Should skip rows that are already ingested', async () => {
    const pg = db.getDb();
    const task = new MessageSyncTask(db, ch, realConfig);
    
    await pg.insert(messageEvents).values({
      guildId: 'g1',
      channelId: 'c1',
      userId: 'u-already-synced',
      messageKind: 'text',
      isBot: false,
      chIngestedAt: new Date(),
    });

    await pg.insert(messageEvents).values({
      guildId: 'g1',
      channelId: 'c1',
      userId: 'u-needs-sync',
      messageKind: 'text',
      isBot: false,
    });

    await task.run();

    const rows = await pg.select().from(messageEvents);
    const synced = rows.find(r => r.userId === 'u-already-synced');
    const newlySynced = rows.find(r => r.userId === 'u-needs-sync');

    expect(synced?.chIngestedAt).toBeDefined();
    expect(newlySynced?.chIngestedAt).toBeDefined();
    expect(newlySynced?.chIngestedAt?.getTime()).not.toBe(synced?.chIngestedAt?.getTime());
  });
});