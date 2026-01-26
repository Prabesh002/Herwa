import { Events, GuildMember } from 'discord.js';
import { IEventHandler } from '@/discord/events/core/event.contract';
import { AppContainer } from '@/core/app-container';
import { MemberPersistenceService } from '@/infrastructure/database/services/analytics/member-persistence.service';

export class MemberAddHandler implements IEventHandler<Events.GuildMemberAdd> {
  public readonly eventName = Events.GuildMemberAdd;
  private readonly persistence: MemberPersistenceService;

  constructor() {
    this.persistence = AppContainer.getInstance().get(MemberPersistenceService);
  }

  public async execute(member: GuildMember): Promise<void> {
    await this.persistence.recordMemberJoin({
      guildId: member.guild.id,
      userId: member.user.id,
    });
  }
}