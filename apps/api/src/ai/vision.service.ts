import { Injectable } from '@nestjs/common';
import { ClaudeService } from './claude.service';

@Injectable()
export class VisionService {
  constructor(private readonly claude: ClaudeService) {}

  async extractProductAttributes(params: {
    organizationId: string;
    imageBase64: string;
    mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
  }): Promise<Record<string, unknown>> {
    return this.claude.visionJson({
      organizationId: params.organizationId,
      system:
        'Extract visible product attributes as JSON: { "attributes": { "brand": string|null, "color": string|null, "material": string|null } }',
      user: 'Analyze the product image and return only JSON.',
      imageBase64: params.imageBase64,
      mediaType: params.mediaType,
    });
  }
}
