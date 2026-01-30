import { describe, test, expect, beforeAll } from 'bun:test';
import { AppContainer } from '@/core/app-container';
import { ClickHouseService } from '@/infrastructure/analytics/core/clickhouse.service';
import { StatsRepository } from '@/infrastructure/analytics/repositories/stats.repository';
import { TestBootstrap } from '@/test/utils/bootstrap';

describe('ClickHouse Idempotency & Aggregation', () => {
  let clickhouse: ClickHouseService;
  let statsRepo: StatsRepository;

  beforeAll(async () => {
    await TestBootstrap.getInstance().initialize();
    
    const container = AppContainer.getInstance();
    clickhouse = container.get(ClickHouseService);
    statsRepo = container.get(StatsRepository);
  });

  test('Message Events: COUNT() should ignore duplicates', async () => {
    const guildId = 'guild-msg-test';
    const messageId = '11111111-1111-1111-1111-111111111111';
    
    const record = {
      id: messageId,
      guild_id: guildId,
      channel_id: 'chan-1',
      user_id: 'user-1',
      created_at: new Date().toISOString().slice(0, 23).replace('T', ' '),
      message_kind: 'text',
      is_bot: 0
    };

    await clickhouse.getClient().insert({
      table: 'message_events',
      values: [record, record, record], // Triple insertion
      format: 'JSONEachRow'
    });

    const stats = await statsRepo.getServerStats(guildId);
    expect(stats.messageCount).toBe(1);
  });

  test('Voice Sessions: SUM() should ignore duplicates', async () => {
    const guildId = 'guild-voice-test';
    const sessionId = '22222222-2222-2222-2222-222222222222';
    const duration = 120; // 2 minutes

    const record = {
      id: sessionId,
      guild_id: guildId,
      channel_id: 'voice-1',
      user_id: 'user-2',
      joined_at: new Date().toISOString().slice(0, 23).replace('T', ' '),
      left_at: new Date().toISOString().slice(0, 23).replace('T', ' '),
      duration_seconds: duration
    };

    await clickhouse.getClient().insert({
      table: 'voice_sessions',
      values: [record, record], 
      format: 'JSONEachRow'
    });

    const stats = await statsRepo.getServerStats(guildId);
    
    // If deduplication fails, this would be 240
    expect(stats.totalVoiceSeconds).toBe(duration);
  });

  test('Member Lifecycle: Should count JOIN and LEAVE separately without duplicates', async () => {
    const guildId = 'guild-member-test';
    const joinId = '33333333-3333-3333-3333-333333333333';
    const leaveId = '44444444-4444-4444-4444-444444444444';

    const joinRecord = {
      id: joinId,
      guild_id: guildId,
      user_id: 'user-3',
      event_type: 'JOIN',
      created_at: new Date().toISOString().slice(0, 23).replace('T', ' ')
    };

    const leaveRecord = {
      id: leaveId,
      guild_id: guildId,
      user_id: 'user-3',
      event_type: 'LEAVE',
      created_at: new Date().toISOString().slice(0, 23).replace('T', ' ')
    };

    // Insert JOIN twice, LEAVE once
    await clickhouse.getClient().insert({
      table: 'member_lifecycle_events',
      values: [joinRecord, joinRecord, leaveRecord],
      format: 'JSONEachRow'
    });

    const stats = await statsRepo.getServerStats(guildId);

    expect(stats.joinCount).toBe(1);
    expect(stats.leaveCount).toBe(1);
  });

  test('Daily Activity: WITH FILL should handle duplicates correctly across days', async () => {
    const guildId = 'guild-daily-test';
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const id1 = '55555555-5555-5555-5555-555555555555';
    const id2 = '66666666-6666-6666-6666-666666666666';

    const recordToday = {
      id: id1,
      guild_id: guildId,
      channel_id: 'chan-1',
      user_id: 'user-1',
      created_at: today.toISOString().slice(0, 23).replace('T', ' '),
      message_kind: 'text',
      is_bot: 0
    };

    const recordYesterday = {
      id: id2,
      guild_id: guildId,
      channel_id: 'chan-1',
      user_id: 'user-1',
      created_at: yesterday.toISOString().slice(0, 23).replace('T', ' '),
      message_kind: 'text',
      is_bot: 0
    };

    // Insert Today x2, Yesterday x1
    await clickhouse.getClient().insert({
      table: 'message_events',
      values: [recordToday, recordToday, recordYesterday],
      format: 'JSONEachRow'
    });

    const dailyStats = await statsRepo.getDailyMessageActivity(guildId, 7);

    // Get the last two entries (Yesterday and Today)
    const lastEntry = dailyStats[dailyStats.length - 1]; // Today
    const prevEntry = dailyStats[dailyStats.length - 2]; // Yesterday

    expect(lastEntry.count).toBe(1);
    expect(prevEntry.count).toBe(1);
    
    // To make sure the array has 8 entries (7 days back + today) due to WITH FILL
    expect(dailyStats.length).toBeGreaterThanOrEqual(8);
  });
});