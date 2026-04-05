import { Injectable } from '@nestjs/common';

@Injectable()
export class EtsyDisclosureService {
  readonly DISCLOSURE_TEXT = '\n\nThis listing description was created with the assistance of AI tools. All product details have been verified by the seller.';

  detectAiGeneratedContent(
    attributes: Array<{ method: string; fieldName: string }>,
  ): boolean {
    return attributes.some(
      attr => attr.method === 'LLM_INFERENCE' && !attr.fieldName.startsWith('_'),
    );
  }

  appendDisclosure(description: string): string {
    if (description.includes('assistance of AI')) {
      return description;
    }
    return description + this.DISCLOSURE_TEXT;
  }
}
