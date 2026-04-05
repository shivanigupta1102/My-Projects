import { Module } from '@nestjs/common';
import { ImageAnalysisService } from './image-analysis.service';
import { BackgroundRemovalService } from './background-removal.service';
import { ImageComplianceService } from './image-compliance.service';
import { ProductClassifierService } from './product-classifier.service';
import { VisionController } from './vision.controller';

@Module({
  controllers: [VisionController],
  providers: [
    ImageAnalysisService,
    BackgroundRemovalService,
    ImageComplianceService,
    ProductClassifierService,
  ],
  exports: [
    ImageAnalysisService,
    BackgroundRemovalService,
    ImageComplianceService,
    ProductClassifierService,
  ],
})
export class VisionModule {}
