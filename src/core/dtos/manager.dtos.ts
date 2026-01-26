import { resetPeriodEnum, subscriptionStatusEnum, paymentStatusEnum } from '@/infrastructure/database/schema/platform/enums.schema';

export interface EnsureDefaultCatalogDto {
  freeTierName: string;
  freeTierPrice: number;
  coreFeatureCode: string;
  coreFeatureName: string;
}

export interface RegisterCommandDto {
  featureCode: string; 
  commandName: string;
  description?: string;
}

export interface ChangeGuildTierDto {
  guildId: string;
  tierName: string;
}

export interface ToggleGuildFeatureDto {
  guildId: string;
  featureCode: string;
  isEnabled: boolean;
}

export interface SetCommandPermissionDto {
  guildId: string;
  commandName: string;
  allowedRoleIds?: string[];
  allowedChannelIds?: string[];
  denyRoleIds?: string[];
}

export interface CreateSubscriptionRecordDto {
  guildId: string;
  tierId: string;
  startsAt: Date;
  endsAt: Date;
  status: (typeof subscriptionStatusEnum.enumValues)[number];
}

export interface RecordPaymentTransactionDto {
  guildId: string;
  subscriptionId: string;
  amount: number;
  provider: string; 
  providerTxId: string;
  status: (typeof paymentStatusEnum.enumValues)[number];
}