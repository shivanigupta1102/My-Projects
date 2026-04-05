import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class BulkRelistService {
  private readonly logger = new Logger(BulkRelistService.name);

  async queueBulkRelist(
    _organizationId: string,
    productIds: string[],
    _createdBy: string,
  ): Promise<{ operationId: string }> {
    this.logger.log(`Queuing bulk relist: ${productIds.length} products`);
    return { operationId: 'bulk-relist-placeholder' };
  }
}
