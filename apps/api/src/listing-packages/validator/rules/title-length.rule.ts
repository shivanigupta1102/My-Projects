import { Channel, Severity } from '@prisma/client';
import {
  AMAZON_TITLE_LIMIT,
  EBAY_TITLE_LIMIT,
  ETSY_TITLE_LIMIT,
  SHOPIFY_TITLE_LIMIT,
} from '@listingpilot/channel-schemas';
import { ValidationIssue } from '@listingpilot/shared-types';

const WALMART_TITLE = 200;

const LIMITS: Record<Channel, number> = {
  AMAZON: AMAZON_TITLE_LIMIT,
  EBAY: EBAY_TITLE_LIMIT,
  WALMART: WALMART_TITLE,
  SHOPIFY: SHOPIFY_TITLE_LIMIT,
  ETSY: ETSY_TITLE_LIMIT,
};

export function titleLengthRule(channel: Channel, title: string | null): ValidationIssue[] {
  const max = LIMITS[channel];
  const t = title ?? '';
  if (t.length > max) {
    return [
      {
        id: 'title-length',
        field: 'title',
        rule: 'title-length',
        severity: Severity.ERROR,
        message: `Title exceeds ${max} characters for ${channel}`,
        suggestedFix: `Shorten title to ${max} characters`,
      },
    ];
  }
  return [];
}
