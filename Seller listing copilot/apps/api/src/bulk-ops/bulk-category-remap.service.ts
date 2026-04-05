import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class BulkCategoryRemapService {
  private readonly logger = new Logger(BulkCategoryRemapService.name);

  async queueBulkRemap(
    _organizationId: string,
    productIds: string[],
    _createdBy: string,
  ): Promise<{ operationId: string }> {
    this.logger.log(`Queuing bulk category remap: ${productIds.length} products`);
    return { operationId: 'bulk-remap-placeholder' };
  }
}
