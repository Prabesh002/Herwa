import { resetPeriodEnum } from '@/infrastructure/database/schema/platform/enums.schema';

// Subscription Tiers
export interface CreateSubscriptionTierDto {
  name: string;
  description?: string;
  priceMonthly: number;
  isDefault?: boolean;
}

// System Features
export interface CreateSystemFeatureDto {
  code: string;
  name: string;
  description?: string;
  isGlobalEnabled?: boolean;
}

// Tier Features (Link)
export interface LinkTierFeatureDto {
  tierId: string;
  featureId: string;
  usageLimit?: number;
  resetPeriod?: (typeof resetPeriodEnum.enumValues)[number];
}

// System Commands
export interface CreateSystemCommandDto {
  featureId: string;
  discordCommandName: string;
  description?: string;
}

export interface UpsertSystemCommandDto {
  featureId: string;
  discordCommandName: string;
  description?: string;
}