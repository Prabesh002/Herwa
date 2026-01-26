import { subscriptionStatusEnum, paymentStatusEnum } from '@/infrastructure/database/schema/platform/enums.schema';

export interface CreateGuildSubscriptionDto {
  guildId: string;
  tierId: string;
  startsAt: Date;
  endsAt: Date;
  status: (typeof subscriptionStatusEnum.enumValues)[number];
}

export interface RecordPaymentDto {
  guildId: string;
  subscriptionId: string;
  amount: number;
  currency?: string;
  provider: string;
  providerTxId?: string;
  status: (typeof paymentStatusEnum.enumValues)[number];
  paidAt?: Date;
}