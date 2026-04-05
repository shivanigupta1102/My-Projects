import { ChannelManifest, ComplianceRule, ImageRules } from './types';

export const WALMART_TITLE_LIMIT = 200;
export const WALMART_BULLET_LIMIT = 10;
export const WALMART_DESCRIPTION_LIMIT = 4000;
export const WALMART_CONTENT_SCORE_TARGET = 90;

export const WALMART_MAIN_IMAGE_RULES: ImageRules = {
  background: 'pure_white',
  minResolution: 1000,
};

export const WALMART_REQUIRED_ATTRIBUTES = [
  'brand', 'manufacturer', 'model', 'color', 'size', 'material',
] as const;

export const WALMART_COMPLIANCE_RULES: ComplianceRule[] = [
  {
    ruleId: 'WALMART_GTIN_REQUIRED',
    severity: 'BLOCKING',
    description: 'Valid GTIN is required for all Walmart listings',
    field: 'gtin',
    policyUrl: 'https://sellerhelp.walmart.com/s/guide?article=000006028',
    autoFixAvailable: false,
  },
  {
    ruleId: 'WALMART_SUPPLIER_ID_REQUIRED',
    severity: 'BLOCKING',
    description: 'Supplier ID is required',
    field: 'supplierId',
    autoFixAvailable: false,
  },
  {
    ruleId: 'WALMART_CONTENT_SCORE',
    severity: 'WARNING',
    description: 'Content score should be at least 90 for optimal listing quality',
    field: '_contentScore',
    autoFixAvailable: false,
  },
  {
    ruleId: 'WALMART_TITLE_LIMIT',
    severity: 'BLOCKING',
    description: 'Title must not exceed 200 characters',
    field: 'title',
    autoFixAvailable: true,
  },
  {
    ruleId: 'WALMART_IMAGE_BACKGROUND',
    severity: 'BLOCKING',
    description: 'Main image must have pure white background',
    field: 'images[0]',
    autoFixAvailable: true,
  },
  {
    ruleId: 'WALMART_IMAGE_RESOLUTION',
    severity: 'BLOCKING',
    description: 'Main image must be at least 1000px on shortest side',
    field: 'images[0]',
    autoFixAvailable: false,
  },
  {
    ruleId: 'WALMART_REQUIRED_ATTRIBUTES',
    severity: 'ERROR',
    description: 'Brand, manufacturer, model, color, size, and material are required',
    field: 'attributes',
    autoFixAvailable: false,
  },
  {
    ruleId: 'WALMART_BULLET_COUNT',
    severity: 'WARNING',
    description: 'At least 3 bullet points recommended for content score',
    field: 'bullets',
    autoFixAvailable: false,
  },
  {
    ruleId: 'WALMART_DESCRIPTION_LENGTH',
    severity: 'WARNING',
    description: 'Description should be at least 150 words for optimal content score',
    field: 'description',
    autoFixAvailable: false,
  },
];

export const WALMART_MANIFEST: ChannelManifest = {
  channel: 'WALMART',
  titleLimit: WALMART_TITLE_LIMIT,
  descriptionLimit: WALMART_DESCRIPTION_LIMIT,
  mainImageRules: WALMART_MAIN_IMAGE_RULES,
  gtinRequired: true,
  requiredFields: ['title', 'brand', 'gtin', 'supplierId', 'price', 'main_image'],
  prohibitedTerms: [],
  complianceRules: WALMART_COMPLIANCE_RULES,
};

export interface WalmartListingSchema {
  title: string;
  brand: string;
  manufacturer: string;
  model: string;
  shortDescription: string;
  mainDescription: string;
  bulletPoints: string[];
  mainImage: string;
  additionalImages: string[];
  gtin: string;
  supplierId: string;
  price: number;
  currency: string;
  condition: 'New' | 'Refurbished' | 'Used';
  attributes: Record<string, string>;
  shippingWeight: number;
  weightUnit: 'LB' | 'KG';
  fulfillmentType: 'SELLER' | 'WFS';
}
