import { ChannelManifest, ComplianceRule, ImageRules } from './types';

export const EBAY_TITLE_LIMIT = 80;
export const EBAY_SUBTITLE_LIMIT = 55;
export const EBAY_DESCRIPTION_LIMIT = 500000;

export const EBAY_MAIN_IMAGE_RULES: ImageRules = {
  minResolution: 500,
  noStockPhotoWatermarks: true,
  selfHostedAllowed: true,
};

export const EBAY_CONDITION_IDS = {
  NEW: 1000,
  OPEN_BOX: 1500,
  REFURBISHED_CERTIFIED: 2000,
  REFURBISHED_EXCELLENT: 2010,
  REFURBISHED_VERY_GOOD: 2020,
  REFURBISHED_GOOD: 2030,
  USED_EXCELLENT: 3000,
  USED_VERY_GOOD: 4000,
  USED_GOOD: 5000,
  USED_ACCEPTABLE: 6000,
  FOR_PARTS: 7000,
} as const;

export const EBAY_COMPLIANCE_RULES: ComplianceRule[] = [
  {
    ruleId: 'EBAY_ITEM_SPECIFICS_REQUIRED',
    severity: 'BLOCKING',
    description: 'Required item specifics for the mapped category must be filled',
    field: 'itemSpecifics',
    policyUrl: 'https://www.ebay.com/help/selling/listings/creating-managing-listings/item-specifics?id=4754',
    autoFixAvailable: false,
  },
  {
    ruleId: 'EBAY_TITLE_CHAR_LIMIT',
    severity: 'BLOCKING',
    description: 'Title must not exceed 80 characters',
    field: 'title',
    autoFixAvailable: true,
  },
  {
    ruleId: 'EBAY_CONDITION_REQUIRED',
    severity: 'BLOCKING',
    description: 'Item condition must be specified with valid condition ID',
    field: 'condition',
    autoFixAvailable: false,
  },
  {
    ruleId: 'EBAY_SHIPPING_POLICY',
    severity: 'BLOCKING',
    description: 'Shipping policy must be defined',
    field: 'shippingPolicy',
    autoFixAvailable: false,
  },
  {
    ruleId: 'EBAY_RETURN_POLICY',
    severity: 'BLOCKING',
    description: 'Return policy must be defined',
    field: 'returnPolicy',
    autoFixAvailable: false,
  },
  {
    ruleId: 'EBAY_CATEGORY_REQUIRED',
    severity: 'BLOCKING',
    description: 'Valid eBay category ID must be mapped',
    field: 'categoryId',
    autoFixAvailable: false,
  },
  {
    ruleId: 'EBAY_IMAGE_RESOLUTION',
    severity: 'WARNING',
    description: 'Images should be at least 500px for best display',
    field: 'images',
    autoFixAvailable: false,
  },
  {
    ruleId: 'EBAY_GTIN_RECOMMENDED',
    severity: 'INFO',
    description: 'GTIN improves search discoverability but is not required',
    field: 'gtin',
    autoFixAvailable: false,
  },
];

export const EBAY_MANIFEST: ChannelManifest = {
  channel: 'EBAY',
  titleLimit: EBAY_TITLE_LIMIT,
  descriptionLimit: EBAY_DESCRIPTION_LIMIT,
  mainImageRules: EBAY_MAIN_IMAGE_RULES,
  gtinRequired: false,
  requiredFields: ['title', 'categoryId', 'itemSpecifics', 'condition', 'shippingPolicy', 'returnPolicy'],
  prohibitedTerms: [],
  complianceRules: EBAY_COMPLIANCE_RULES,
};

export interface EbayListingSchema {
  title: string;
  subtitle?: string;
  categoryId: string;
  itemSpecifics: Record<string, string>;
  condition: keyof typeof EBAY_CONDITION_IDS;
  conditionDescription?: string;
  description: string;
  shortDescription?: string;
  images: string[];
  price: number;
  currency: string;
  quantity: number;
  listingFormat: 'FIXED_PRICE' | 'AUCTION';
  shippingPolicy: string;
  returnPolicy: string;
  gtin?: string;
}
