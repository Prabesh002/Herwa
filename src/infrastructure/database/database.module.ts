import { AppContainer } from '@/core/app-container';
import { DatabaseService } from '@/infrastructure/database/core/database.service';
import { MessageRepository } from './repositories/analytics/message.repository';
import { MemberLifecycleRepository } from './repositories/analytics/member-lifecycle.repository';
import { VoiceRepository } from './repositories/analytics/voice.repository';
import { MessagePersistenceService } from './services/message-persistence.service';
import { MemberPersistenceService } from './services/member-persistence.service';
import { VoicePersistenceService } from './services/voice-persistence.service';

export function loadDatabaseModule(container: AppContainer): void {
  container.register(DatabaseService, new DatabaseService());
  
  container.register(MessageRepository, new MessageRepository());
  container.register(MemberLifecycleRepository, new MemberLifecycleRepository());
  container.register(VoiceRepository, new VoiceRepository());

  container.register(MessagePersistenceService, new MessagePersistenceService());
  container.register(MemberPersistenceService, new MemberPersistenceService());
  container.register(VoicePersistenceService, new VoicePersistenceService());
}