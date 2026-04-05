import { Controller, Post, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { DuplicateDetectionService } from './duplicate-detection.service';

@ApiTags('Semantic Dedup')
@ApiBearerAuth()
@Controller('api/v1/products/:productId')
export class SemanticDedupController {
  constructor(private readonly dedupService: DuplicateDetectionService) {}

  @Post('detect-duplicates')
  async detectDuplicates(@Param('productId') productId: string) {
    void this.dedupService;
    return { productId, duplicates: [] };
  }
}
