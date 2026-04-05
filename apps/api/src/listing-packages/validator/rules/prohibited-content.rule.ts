import { AMAZON_PROHIBITED_TERMS } from '@listingpilot/channel-schemas';
import { Severity } from '@prisma/client';
import { ValidationIssue } from '@listingpilot/shared-types';

const GENERIC = ['guaranteed cure', 'miracle cure', '100% cure'];

export function prohibitedContentRule(text: string): ValidationIssue[] {
  const lower = text.toLowerCase();
  const issues: ValidationIssue[] = [];
  const terms = [...AMAZON_PROHIBITED_TERMS, ...GENERIC];
  let i = 0;
  for (const term of terms) {
    if (lower.includes(term)) {
      issues.push({
        id: `prohibited-${i++}`,
        field: 'description',
        rule: 'prohibited-content',
        severity: Severity.BLOCKING,
        message: `Potentially prohibited term: "${term}"`,
        suggestedFix: 'Remove or rephrase promotional claims',
      });
    }
  }
  return issues;
}
