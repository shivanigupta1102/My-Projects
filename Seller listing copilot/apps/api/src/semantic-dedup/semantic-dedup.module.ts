import { Module } from '@nestjs/common';
import { DuplicateDetectionService } from './duplicate-detection.service';
import { SemanticDedupController } from './semantic-dedup.controller';

@Module({
  controllers: [SemanticDedupController],
  providers: [DuplicateDetectionService],
  exports: [DuplicateDetectionService],
})
export class SemanticDedupModule {}
