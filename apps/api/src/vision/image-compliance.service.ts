import { Injectable } from '@nestjs/common';
import { CHANNEL_MANIFESTS } from '@listingpilot/channel-schemas';

export interface ImageComplianceResult {
  channel: string;
  violations: Array<{
    ruleId: string;
    severity: 'BLOCKING' | 'ERROR' | 'WARNING';
    description: string;
    autoFixAvailable: boolean;
  }>;
  passed: boolean;
}

@Injectable()
export class ImageComplianceService {
  async checkCompliance(
    imageMetadata: {
      width: number;
      height: number;
      hasWhiteBackground: boolean;
      hasTextOverlay: boolean;
      hasWatermark: boolean;
      blurScore: number;
      fileSizeBytes: number;
      format: string;
    },
    channel: string,
  ): Promise<ImageComplianceResult> {
    const manifest = CHANNEL_MANIFESTS[channel];
    if (!manifest) {
      return { channel, violations: [], passed: true };
    }

    const violations: ImageComplianceResult['violations'] = [];
    const rules = manifest.mainImageRules;

    if (rules.background === 'pure_white' && !imageMetadata.hasWhiteBackground) {
      violations.push({
        ruleId: `${channel}_MAIN_IMAGE_BACKGROUND`,
        severity: 'BLOCKING',
        description: 'Main image must have pure white (#FFFFFF) background',
        autoFixAvailable: true,
      });
    }

    const shortestSide = Math.min(imageMetadata.width, imageMetadata.height);
    if (shortestSide < rules.minResolution) {
      violations.push({
        ruleId: `${channel}_IMAGE_RESOLUTION`,
        severity: 'BLOCKING',
        description: `Image must be at least ${rules.minResolution}px on shortest side (got ${shortestSide}px)`,
        autoFixAvailable: false,
      });
    }

    if (rules.noTextOrWatermarks && (imageMetadata.hasTextOverlay || imageMetadata.hasWatermark)) {
      violations.push({
        ruleId: `${channel}_IMAGE_TEXT_WATERMARK`,
        severity: 'BLOCKING',
        description: 'Images must not contain text overlays or watermarks',
        autoFixAvailable: false,
      });
    }

    if (rules.maxFileSize && imageMetadata.fileSizeBytes > rules.maxFileSize) {
      violations.push({
        ruleId: `${channel}_IMAGE_FILE_SIZE`,
        severity: 'ERROR',
        description: `Image exceeds maximum file size of ${Math.round(rules.maxFileSize / 1024 / 1024)}MB`,
        autoFixAvailable: true,
      });
    }

    if (rules.allowedFormats && !rules.allowedFormats.includes(imageMetadata.format.toUpperCase())) {
      violations.push({
        ruleId: `${channel}_IMAGE_FORMAT`,
        severity: 'ERROR',
        description: `Image format ${imageMetadata.format} not allowed. Use: ${rules.allowedFormats.join(', ')}`,
        autoFixAvailable: true,
      });
    }

    return {
      channel,
      violations,
      passed: violations.filter(v => v.severity === 'BLOCKING').length === 0,
    };
  }
}
