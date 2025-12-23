import { Events, GuildMember } from 'discord.js';
import { IEventHandler } from '@/discord/events/core/event.contract';
import { AppContainer } from '@/core/app-container';
import { DatabaseService } from '@/infrastructure/database/core/database.service';
import { memberLifecycleEvents } from '@/infrastructure/database/schema/member-lifecycle.schema';

export class MemberAddHandler implements IEventHandler<Events.GuildMemberAdd> {
  public readonly eventName = Events.GuildMemberAdd;
  private readonly databaseService: DatabaseService;

  constructor() {
    this.databaseService = AppContainer.getInstance().get(DatabaseService);
  }

  public async execute(member: GuildMember): Promise<void> {
    const db = this.databaseService.getDb();
    
    await db.insert(memberLifecycleEvents).values({
      guildId: member.guild.id,
      userId: member.user.id,
      eventType: 'JOIN',
    });
  }
}