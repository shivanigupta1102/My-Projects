import { Severity } from '@prisma/client';
import { ValidationIssue } from '@listingpilot/shared-types';
import { CanonicalFacts } from '../../generators/channel-generator.interface';

export function imageCompletenessRule(facts: CanonicalFacts): ValidationIssue[] {
  if (!facts.images.length) {
    return [
      {
        id: 'images-missing',
        field: 'images',
        rule: 'image-completeness',
        severity: Severity.WARNING,
        message: 'At least one product image is recommended',
        suggestedFix: 'Upload a main image',
      },
    ];
  }
  return [];
}
