export interface CachedCommandPermission {
  allowedRoleIds?: string[];
  allowedChannelIds?: string[];
  denyRoleIds?: string[];
}

export interface CachedGuildEntitlements {
  tierId: string;
  tierName:string;
  subscriptionExpiresAt?: Date | null;
  
  tierFeatures: Set<string>; 
  
  disabledFeatures: Set<string>; 
  
  commandPermissions: Map<string, CachedCommandPermission>; 
}

export interface CachedCommand {
  featureId: string;
  featureCode: string;
  isMaintenance: boolean;
  isGlobalEnabled: boolean;
}