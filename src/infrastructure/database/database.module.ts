import { AppContainer } from '@/core/app-container';
import { DatabaseService } from '@/infrastructure/database/core/database.service';

import { MessageRepository } from './repositories/analytics/message.repository';
import { MemberLifecycleRepository } from './repositories/analytics/member-lifecycle.repository';
import { VoiceRepository } from './repositories/analytics/voice.repository';
import { MessagePersistenceService } from './services/analytics/message-persistence.service';
import { MemberPersistenceService } from './services/analytics/member-persistence.service';
import { VoicePersistenceService } from './services/analytics/voice-persistence.service';

import { SubscriptionTierRepository } from './repositories/platform/catalog/subscription-tier.repository';
import { SystemFeatureRepository } from './repositories/platform/catalog/system-feature.repository';
import { SystemCommandRepository } from './repositories/platform/catalog/system-command.repository';
import { SubscriptionTierPersistenceService } from './services/platform/catalog/subscription-tier.persistence.service';
import { SystemFeaturePersistenceService } from './services/platform/catalog/system-feature.persistence.service';
import { TierFeaturePersistenceService } from './services/platform/catalog/tier-feature.persistence.service';
import { SystemCommandPersistenceService } from './services/platform/catalog/system-command.persistence.service';

import { GuildSettingsRepository } from './repositories/platform/entitlement/guild-settings.repository';
import { GuildFeatureOverrideRepository } from './repositories/platform/entitlement/guild-feature-override.repository';
import { GuildCommandPermissionRepository } from './repositories/platform/entitlement/guild-command-permission.repository';
import { GuildSettingsPersistenceService } from './services/platform/entitlement/guild-settings.persistence.service';
import { GuildFeatureOverridePersistenceService } from './services/platform/entitlement/guild-feature-override.persistence.service';
import { GuildCommandPermissionPersistenceService } from './services/platform/entitlement/guild-command-permission.persistence.service';

import { GuildSubscriptionRepository } from './repositories/platform/history/guild-subscription.repository';
import { PaymentRepository } from './repositories/platform/history/payment.repository';
import { GuildSubscriptionPersistenceService } from './services/platform/history/guild-subscription.persistence.service';
import { PaymentPersistenceService } from './services/platform/history/payment.persistence.service';

export function loadDatabaseModule(container: AppContainer): void {
  container.register(DatabaseService, new DatabaseService());
  
  container.register(MessageRepository, new MessageRepository());
  container.register(MemberLifecycleRepository, new MemberLifecycleRepository());
  container.register(VoiceRepository, new VoiceRepository());
  container.register(MessagePersistenceService, new MessagePersistenceService());
  container.register(MemberPersistenceService, new MemberPersistenceService());
  container.register(VoicePersistenceService, new VoicePersistenceService());

  container.register(SubscriptionTierRepository, new SubscriptionTierRepository());
  container.register(SystemFeatureRepository, new SystemFeatureRepository());
  container.register(SystemCommandRepository, new SystemCommandRepository());
  container.register(SubscriptionTierPersistenceService, new SubscriptionTierPersistenceService());
  container.register(SystemFeaturePersistenceService, new SystemFeaturePersistenceService());
  container.register(TierFeaturePersistenceService, new TierFeaturePersistenceService());
  container.register(SystemCommandPersistenceService, new SystemCommandPersistenceService());

  container.register(GuildSettingsRepository, new GuildSettingsRepository());
  container.register(GuildFeatureOverrideRepository, new GuildFeatureOverrideRepository());
  container.register(GuildCommandPermissionRepository, new GuildCommandPermissionRepository());
  container.register(GuildSettingsPersistenceService, new GuildSettingsPersistenceService());
  container.register(GuildFeatureOverridePersistenceService, new GuildFeatureOverridePersistenceService());
  container.register(GuildCommandPermissionPersistenceService, new GuildCommandPermissionPersistenceService());

  container.register(GuildSubscriptionRepository, new GuildSubscriptionRepository());
  container.register(PaymentRepository, new PaymentRepository());
  container.register(GuildSubscriptionPersistenceService, new GuildSubscriptionPersistenceService());
  container.register(PaymentPersistenceService, new PaymentPersistenceService());
}