import { Module } from '@nestjs/common';
import { BulkPublishService } from './bulk-publish.service';
import { BulkRelistService } from './bulk-relist.service';
import { BulkCategoryRemapService } from './bulk-category-remap.service';
import { BulkOpsController } from './bulk-ops.controller';

@Module({
  controllers: [BulkOpsController],
  providers: [BulkPublishService, BulkRelistService, BulkCategoryRemapService],
  exports: [BulkPublishService, BulkRelistService, BulkCategoryRemapService],
})
export class BulkOpsModule {}
