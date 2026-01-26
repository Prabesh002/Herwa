import { resetPeriodEnum, subscriptionStatusEnum, paymentStatusEnum } from '@/infrastructure/database/schema/platform/enums.schema';

export interface EnsureDefaultCatalogDto {
  freeTierName: string;
  freeTierPrice: number;
  freeTierDescription: string;
  coreFeatureCode: string;
  coreFeatureName: string;
  coreFeatureDescription: string;
}

export interface RegisterCommandDto {
  featureCode: string;
  commandName: string;
  description?: string;
}

export interface CreateTierDto {
  name: string;
  description: string;
  priceMonthly: number;
  isDefault?: boolean;
}

export interface CreateFeatureDto {
  code: string;
  name: string;
  description: string;
}

export interface LinkFeatureToTierDto {
  featureCode: string;
  tierName: string;
}


export interface EntitlementCheckDto {
  guildId: string;
  userId: string;
  commandName: string;
  channelId: string;
  memberRoles: string[];
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