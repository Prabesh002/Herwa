import { pgEnum } from 'drizzle-orm/pg-core';

export const resetPeriodEnum = pgEnum('reset_period', [
  'DAILY',
  'MONTHLY',
  'YEARLY',
]);

export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'ACTIVE',
  'EXPIRED',
  'CANCELED',
  'REFUNDED',
]);

export const paymentStatusEnum = pgEnum('payment_status', [
  'PENDING',
  'SUCCESS',
  'FAILED',
  'REFUNDED',
]);