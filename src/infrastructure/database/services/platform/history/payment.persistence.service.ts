import { DbConnection } from '@/infrastructure/database/core/types';
import { payments } from '@/infrastructure/database/schema';
import { RecordPaymentDto } from '@/infrastructure/database/dtos/platform/history.dtos';

export class PaymentPersistenceService {
  async create(db: DbConnection, dto: RecordPaymentDto): Promise<string> {
    const [record] = await db
      .insert(payments)
      .values(dto)
      .returning({ id: payments.id });
    return record.id;
  }
}