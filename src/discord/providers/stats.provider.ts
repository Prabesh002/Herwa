import { AppContainer } from '@/core/app-container';
import { MessageRepository } from '@/infrastructure/database/repositories/message.repository';
import { MemberLifecycleRepository } from '@/infrastructure/database/repositories/member-lifecycle.repository';
import { VoiceRepository } from '@/infrastructure/database/repositories/voice.repository';
import { ServerStatsData } from './models/stats.provider.contract';


export class StatsProvider {
  private readonly messageRepo = AppContainer.getInstance().get(MessageRepository);
  private readonly memberRepo = AppContainer.getInstance().get(MemberLifecycleRepository);
  private readonly voiceRepo = AppContainer.getInstance().get(VoiceRepository);

  public async getServerStats(guildId: string): Promise<ServerStatsData> {
    const [messageCount, joinCount, leaveCount, totalVoiceSeconds] = await Promise.all([
      this.messageRepo.getTotalCountByGuild(guildId),
      this.memberRepo.getJoinCountByGuild(guildId),
      this.memberRepo.getLeaveCountByGuild(guildId),
      this.voiceRepo.getTotalDurationByGuild(guildId),
    ]);

    return {
      messageCount,
      joinCount,
      leaveCount,
      totalVoiceSeconds,
    };
  }
}