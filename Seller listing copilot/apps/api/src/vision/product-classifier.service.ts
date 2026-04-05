import { Injectable, Logger } from '@nestjs/common';

export interface ClassificationResult {
  channel: string;
  categoryId: string;
  categoryPath: string;
  confidence: number;
  alternativeCategories: Array<{ categoryId: string; categoryPath: string; confidence: number }>;
}

@Injectable()
export class ProductClassifierService {
  private readonly logger = new Logger(ProductClassifierService.name);

  async classifyProduct(
    _productDescription: string,
    channel: string,
  ): Promise<ClassificationResult> {
    this.logger.log(`Classifying product for ${channel}`);

    // Uses Claude with category taxonomy documents as context
    // Also queries Qdrant for semantic similarity against prior confirmed mappings
    return {
      channel,
      categoryId: '',
      categoryPath: '',
      confidence: 0,
      alternativeCategories: [],
    };
  }
}
