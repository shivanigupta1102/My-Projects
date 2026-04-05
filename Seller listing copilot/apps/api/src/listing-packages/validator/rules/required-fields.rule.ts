import { Channel, Severity } from '@prisma/client';
import { ValidationIssue } from '@listingpilot/shared-types';
import { CanonicalFacts } from '../../generators/channel-generator.interface';

const REQUIRED_BY_CHANNEL: Record<Channel, string[]> = {
  AMAZON: ['title', 'brand'],
  EBAY: ['title'],
  WALMART: ['title'],
  SHOPIFY: ['title'],
  ETSY: ['title'],
};

export function requiredFieldsRule(
  channel: Channel,
  facts: CanonicalFacts,
): ValidationIssue[] {
  const required = REQUIRED_BY_CHANNEL[channel] ?? ['title'];
  const issues: ValidationIssue[] = [];
  for (const f of required) {
    const val = (facts.attributes as Record<string, unknown>)[f] ?? (f === 'title' ? facts.title : null);
    if (val === null || val === undefined || val === '') {
      issues.push({
        id: `req-${f}`,
        field: f,
        rule: 'required-fields',
        severity: Severity.BLOCKING,
        message: `Missing required field: ${f}`,
        suggestedFix: `Provide ${f} in canonical data`,
      });
    }
  }
  return issues;
}
