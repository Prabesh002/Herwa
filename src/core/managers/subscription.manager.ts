import { AppContainer } from '@/core/app-container';
import { DatabaseService } from '@/infrastructure/database/core/database.service';
import { GuildSubscriptionPersistenceService } from '@/infrastructure/database/services/platform/history/guild-subscription.persistence.service';
import { PaymentPersistenceService } from '@/infrastructure/database/services/platform/history/payment.persistence.service';
import { CreateSubscriptionRecordDto, RecordPaymentTransactionDto } from '@/core/dtos/manager.dtos';

export class SubscriptionManager {
  private db = AppContainer.getInstance().get(DatabaseService);
  
  private subService = AppContainer.getInstance().get(GuildSubscriptionPersistenceService);
  private paymentService = AppContainer.getInstance().get(PaymentPersistenceService);

  /**
   * Creates an immutable history record of a subscription period.
   * This is usually called by a webhook handler (e.g., Stripe Webhook).
   */
  public async createSubscription(dto: CreateSubscriptionRecordDto): Promise<string> {
    return await this.db.getDb().transaction(async (tx) => {
      return await this.subService.create(tx, {
        guildId: dto.guildId,
        tierId: dto.tierId,
        startsAt: dto.startsAt,
        endsAt: dto.endsAt,
        status: dto.status,
      });
    });
  }

  /**
   * Records a payment linked to a subscription.
   */
  public async recordPayment(dto: RecordPaymentTransactionDto): Promise<void> {
    await this.db.getDb().transaction(async (tx) => {
      await this.paymentService.create(tx, {
        guildId: dto.guildId,
        subscriptionId: dto.subscriptionId,
        amount: dto.amount,
        provider: dto.provider,
        providerTxId: dto.providerTxId,
        status: dto.status,
        paidAt: new Date(), // always recorded as now.
      });
    });
  }
}