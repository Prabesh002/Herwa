import { eq, desc } from 'drizzle-orm';
import { DbConnection } from '@/infrastructure/database/core/types';
import { payments } from '@/infrastructure/database/schema';

export class PaymentRepository {
  async getBySubscriptionId(db: DbConnection, subscriptionId: string) {
    return db.query.payments.findMany({
      where: eq(payments.subscriptionId, subscriptionId),
      orderBy: [desc(payments.createdAt)],
    });
  }

  async getByGuildId(db: DbConnection, guildId: string) {
    return db.query.payments.findMany({
      where: eq(payments.guildId, guildId),
      orderBy: [desc(payments.createdAt)],
    });
  }
}