import { AppContainer } from '@/core/app-container';
import { StatsRepository } from '@/infrastructure/analytics/repositories/stats.repository';
import { ServerStatsData } from './models/stats.provider.contract';

export class StatsProvider {
  private readonly statsRepo = AppContainer.getInstance().get(StatsRepository);

  public async getServerStats(guildId: string): Promise<ServerStatsData> {
    return this.statsRepo.getServerStats(guildId);
  }
}