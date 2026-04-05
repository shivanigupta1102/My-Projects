import { Controller, Post, Get, Param, Body, Sse, MessageEvent } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Observable, of } from 'rxjs';
import { BulkPublishService } from './bulk-publish.service';
import { BulkRelistService } from './bulk-relist.service';

@ApiTags('Bulk Operations')
@ApiBearerAuth()
@Controller('api/v1/bulk')
export class BulkOpsController {
  constructor(
    private readonly bulkPublish: BulkPublishService,
    private readonly bulkRelist: BulkRelistService,
  ) {}

  @Post('publish')
  async publish(
    @Body() body: { productIds: string[]; channels: string[] },
  ) {
    const result = await this.bulkPublish.queueBulkPublish(
      'org-placeholder', body.productIds, body.channels, 'user-placeholder',
    );
    return result;
  }

  @Post('relist')
  async relist(@Body() body: { productIds: string[] }) {
    return this.bulkRelist.queueBulkRelist('org-placeholder', body.productIds, 'user-placeholder');
  }

  @Get(':operationId/status')
  @Sse()
  status(@Param('operationId') operationId: string): Observable<MessageEvent> {
    const progress = { operationId, status: 'QUEUED', processedItems: 0, totalItems: 0 };
    return of({ data: JSON.stringify(progress) } as MessageEvent);
  }
}
