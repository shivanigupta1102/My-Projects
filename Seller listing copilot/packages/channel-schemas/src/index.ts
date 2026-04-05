export * from './types';
export * from './amazon.schema';
export * from './ebay.schema';
export * from './etsy.schema';
export * from './shopify.schema';
export * from './walmart.schema';

import { AMAZON_MANIFEST } from './amazon.schema';
import { EBAY_MANIFEST } from './ebay.schema';
import { ETSY_MANIFEST } from './etsy.schema';
import { SHOPIFY_MANIFEST } from './shopify.schema';
import { WALMART_MANIFEST } from './walmart.schema';
import { ChannelManifest } from './types';

export const CHANNEL_MANIFESTS: Record<string, ChannelManifest> = {
  AMAZON: AMAZON_MANIFEST,
  EBAY: EBAY_MANIFEST,
  ETSY: ETSY_MANIFEST,
  SHOPIFY: SHOPIFY_MANIFEST,
  WALMART: WALMART_MANIFEST,
};
