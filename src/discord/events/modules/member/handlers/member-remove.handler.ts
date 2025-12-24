import { Events, GuildMember, PartialGuildMember } from 'discord.js';
import { IEventHandler } from '@/discord/events/core/event.contract';
import { AppContainer } from '@/core/app-container';
import { MemberPersistenceService } from '@/infrastructure/database/services/member-persistence.service';

export class MemberRemoveHandler implements IEventHandler<Events.GuildMemberRemove> {
  public readonly eventName = Events.GuildMemberRemove;
  private readonly persistence: MemberPersistenceService;

  constructor() {
    this.persistence = AppContainer.getInstance().get(MemberPersistenceService);
  }

  public async execute(member: GuildMember | PartialGuildMember): Promise<void> {
    await this.persistence.recordMemberLeave({
      guildId: member.guild.id,
      userId: member.user.id,
    });
  }
}