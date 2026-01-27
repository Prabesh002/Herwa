export const DEFAULT_TIERS = [
  {
    name: 'Free',
    description: 'Basic tracking and core commands.',
    priceMonthly: 0,
    isDefault: true,
  },
  {
    name: 'Pro',
    description: 'Advanced analytics, historical data, and priority support.',
    priceMonthly: 500,
    isDefault: false,
  },
];

export const DEFAULT_FEATURES = [
  {
    code: 'core',
    name: 'Core System',
    description: 'Basic bot functionality and utility commands.',
    tiers: ['Free', 'Pro'],
  },
  {
    code: 'analytics',
    name: 'Advanced Analytics',
    description: 'Deep insights into message velocity and user engagement.',
    tiers: ['Pro'],
  },
];

export const COMMAND_FEATURE_MAP: Record<string, string> = {
  ping: 'core',
  'server-stats': 'analytics',
};