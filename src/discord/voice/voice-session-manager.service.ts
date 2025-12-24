import { VoiceState } from 'discord.js';
import { AppContainer } from '@/core/app-container';
import { createLogger, Logger } from '@/infrastructure/logging/logger';
import { VoicePersistenceService } from '@/infrastructure/database/services/voice-persistence.service';
import type { voiceSessions } from '@/infrastructure/database/schema/voice-sessions.schema';

type NewVoiceSession = typeof voiceSessions.$inferInsert;

type ActiveSession = {
  channelId: string;
  joinedAt: Date;
};

export class VoiceSessionManager {
  private readonly activeSessions = new Map<string, ActiveSession>();
  private readonly logger: Logger;
  private readonly persistence: VoicePersistenceService;

  constructor() {
    this.logger = createLogger('info').child({ service: 'VoiceSessionManager' });
    this.persistence = AppContainer.getInstance().get(VoicePersistenceService);
  }

  public handleStateUpdate(oldState: VoiceState, newState: VoiceState): void {
    const user = newState.member?.user;
    if (!user || user.bot) return;

    const oldChannel = oldState.channelId;
    const newChannel = newState.channelId;
    const sessionKey = `${newState.guild.id}-${user.id}`;

    const joined = !oldChannel && newChannel;
    const left = oldChannel && !newChannel;
    const moved = oldChannel && newChannel && oldChannel !== newChannel;

    if (joined) {
      this.startSession(sessionKey, newChannel!, newState.guild.id);
    } else if (left) {
      this.endSession(sessionKey);
    } else if (moved) {
      this.endSession(sessionKey);
      this.startSession(sessionKey, newChannel!, newState.guild.id);
    }
  }

  private startSession(sessionKey: string, channelId: string, guildId: string): void {
    const session: ActiveSession = {
      channelId,
      joinedAt: new Date(),
    };
    this.activeSessions.set(sessionKey, session);
    this.logger.debug({ sessionKey }, 'Voice session started.');
  }

  private async endSession(sessionKey: string): Promise<void> {
    const session = this.activeSessions.get(sessionKey);
    if (!session) return;

    const [guildId, userId] = sessionKey.split('-');

    if (!guildId || !userId) {
      this.logger.error({ sessionKey }, 'Invalid session key format; cannot record session.');
      this.activeSessions.delete(sessionKey);
      return;
    }

    const leftAt = new Date();
    const durationSeconds = Math.round((leftAt.getTime() - session.joinedAt.getTime()) / 1000);

    if (durationSeconds < 5) {
      this.activeSessions.delete(sessionKey);
      return;
    }

    try {
      const newSession: NewVoiceSession = {
        guildId: guildId,
        userId: userId,
        channelId: session.channelId,
        joinedAt: session.joinedAt,
        leftAt: leftAt,
        durationSeconds: durationSeconds,
      };

      await this.persistence.recordVoiceSession(newSession);

      this.logger.debug({ sessionKey, durationSeconds }, 'Voice session ended and recorded.');
    } catch (error) {
      this.logger.error({ err: error, sessionKey }, 'Failed to record voice session.');
    } finally {
      this.activeSessions.delete(sessionKey);
    }
  }
}