import { AppContainer } from '@/core/app-container';
import { DatabaseService } from '@/infrastructure/database/core/database.service';
import { MessageRepository } from './repositories/message.repository';
import { MemberLifecycleRepository } from './repositories/member-lifecycle.repository';
import { VoiceRepository } from './repositories/voice.repository';

export function loadDatabaseModule(container: AppContainer): void {
  container.register(DatabaseService, new DatabaseService());
  
  container.register(MessageRepository, new MessageRepository());
  container.register(MemberLifecycleRepository, new MemberLifecycleRepository());
  container.register(VoiceRepository, new VoiceRepository());
}