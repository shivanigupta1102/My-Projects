import { Controller, Post, Get, Param, Body, Sse, MessageEvent } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Observable, of } from 'rxjs';
import { BulkPublishService } from './bulk-publish.service';
import { BulkRelistService } from './bulk-relist.service';

@ApiTags('Bulk Operations')
@ApiBearerAuth()
@Controller('bulk')
export class BulkOpsController {
  constructor(
    private readonly bulkPublish: BulkPublishService,
    private readonly bulkRelist: BulkRelistService,
  ) {}

  @Post('publish')
  async publish(
    @Body() body: { productIds: string[]; channels: string[] },
  ) {
    const data = await this.bulkPublish.queueBulkPublish(
      'org-placeholder', body.productIds, body.channels, 'user-placeholder',
    );
    return { success: true, data };
  }

  @Post('relist')
  async relist(@Body() body: { productIds: string[] }) {
    const data = await this.bulkRelist.queueBulkRelist('org-placeholder', body.productIds, 'user-placeholder');
    return { success: true, data };
  }

  @Get(':operationId/status')
  @Sse()
  status(@Param('operationId') operationId: string): Observable<MessageEvent> {
    const progress = { operationId, status: 'QUEUED', processedItems: 0, totalItems: 0 };
    return of({ data: JSON.stringify(progress) } as MessageEvent);
  }
}
