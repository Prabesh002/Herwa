import { Events, GuildMember, PartialGuildMember } from 'discord.js';
import { IEventHandler } from '@/discord/events/core/event.contract';
import { AppContainer } from '@/core/app-container';
import { DatabaseService } from '@/infrastructure/database/core/database.service';
import { memberLifecycleEvents } from '@/infrastructure/database/schema/member-lifecycle.schema';

export class MemberRemoveHandler implements IEventHandler<Events.GuildMemberRemove> {
  public readonly eventName = Events.GuildMemberRemove;
  private readonly databaseService: DatabaseService;

  constructor() {
    this.databaseService = AppContainer.getInstance().get(DatabaseService);
  }

  public async execute(member: GuildMember | PartialGuildMember): Promise<void> {
    const db = this.databaseService.getDb();
    
    await db.insert(memberLifecycleEvents).values({
      guildId: member.guild.id,
      userId: member.user.id,
      eventType: 'LEAVE',
    });
  }
}