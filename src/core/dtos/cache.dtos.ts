import { resetPeriodEnum } from '@/infrastructure/database/schema/platform/enums.schema';

export interface CachedCommandPermission {
  allowedRoleIds?: string[];
  allowedChannelIds?: string[];
  denyRoleIds?: string[];
}

export interface CachedFeatureQuota {
  limit: number | null;
  resetPeriod: typeof resetPeriodEnum.enumValues[number] | null;
}

export interface CachedGuildEntitlements {
  tierId: string;
  tierName: string;
  subscriptionExpiresAt?: Date | null;
  
  tierFeatures: Map<string, CachedFeatureQuota>; 
  
  disabledFeatures: Set<string>; 
  
  commandPermissions: Map<string, CachedCommandPermission>; 
}

export interface CachedCommand {
  featureId: string;
  featureCode: string;
  isMaintenance: boolean;
  isGlobalEnabled: boolean;
}