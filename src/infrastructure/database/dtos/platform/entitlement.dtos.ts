// Guild Settings
export interface CreateGuildSettingsDto {
  guildId: string;
  tierId: string;
}

// Feature Overrides
export interface SetGuildFeatureOverrideDto {
  guildId: string;
  featureId: string;
  isEnabled: boolean;
}

// Feature Usage
export interface UpsertGuildFeatureUsageDto {
  guildId: string;
  featureId: string;
  periodStart: Date;
  periodEnd: Date;
  usageCount: number;
}

// Command Permissions
export interface SetGuildCommandPermissionDto {
  guildId: string;
  commandName: string;
  allowedRoleIds?: string[];
  allowedChannelIds?: string[];
  denyRoleIds?: string[];
}