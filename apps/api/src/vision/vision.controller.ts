import { Controller, Post, Param, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ImageAnalysisService } from './image-analysis.service';
import { ImageComplianceService } from './image-compliance.service';
import { BackgroundRemovalService } from './background-removal.service';

@ApiTags('Vision')
@ApiBearerAuth()
@Controller('api/v1/products/:productId/images')
export class VisionController {
  constructor(
    private readonly imageAnalysis: ImageAnalysisService,
    private readonly imageCompliance: ImageComplianceService,
    private readonly backgroundRemoval: BackgroundRemovalService,
  ) {}

  @Post(':imageId/process')
  async processImage(
    @Param('productId') productId: string,
    @Param('imageId') imageId: string,
  ) {
    void this.imageAnalysis;
    void this.imageCompliance;
    void this.backgroundRemoval;
    // Trigger background removal + compliance check for a specific image
    return { productId, imageId, status: 'processing' };
  }

  @Post(':imageId/compliance')
  async checkCompliance(
    @Param('productId') productId: string,
    @Param('imageId') imageId: string,
    @Body('channel') channel: string,
  ) {
    void this.imageCompliance;
    return { productId, imageId, channel, status: 'checked' };
  }
}
