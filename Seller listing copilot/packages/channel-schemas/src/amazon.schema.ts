import { ChannelManifest, ComplianceRule, ImageRules } from './types';

export const AMAZON_TITLE_LIMIT = 200; // bytes, not chars — matters for Unicode
export const AMAZON_BULLET_LIMIT = 5;
export const AMAZON_BULLET_CHAR_LIMIT = 255;
export const AMAZON_DESCRIPTION_LIMIT = 2000;
export const AMAZON_BACKEND_KEYWORDS_LIMIT = 250; // bytes

export const AMAZON_MAIN_IMAGE_RULES: ImageRules = {
  background: 'pure_white',
  minResolution: 1000,
  maxFileSize: 10 * 1024 * 1024,
  allowedFormats: ['JPEG', 'PNG', 'GIF', 'TIFF'],
  noTextOrWatermarks: true,
  noPropsOrMannequins: true,
};

export const AMAZON_PROHIBITED_TERMS = [
  'best seller', '#1', 'guaranteed', 'free shipping', 'warranty included',
  'FDA approved', 'environmentally friendly', 'organic',
  'top rated', 'limited time', 'act now', 'discount', 'sale', 'cheap',
] as const;

export const AMAZON_REQUIRED_FIELDS = [
  'title', 'brand', 'category', 'main_image', 'price', 'gtin',
] as const;

export const AMAZON_COMPLIANCE_RULES: ComplianceRule[] = [
  {
    ruleId: 'AMAZON_GTIN_REQUIRED',
    severity: 'BLOCKING',
    description: 'Valid GTIN required for this category unless GTIN-exempt',
    field: 'gtin',
    policyUrl: 'https://sellercentral.amazon.com/help/hub/reference/G200317470',
    autoFixAvailable: false,
  },
  {
    ruleId: 'AMAZON_MAIN_IMAGE_BACKGROUND',
    severity: 'BLOCKING',
    description: 'Main image must have pure white (#FFFFFF) background',
    field: 'images[0]',
    policyUrl: 'https://sellercentral.amazon.com/help/hub/reference/G1881',
    autoFixAvailable: true,
  },
  {
    ruleId: 'AMAZON_PROHIBITED_TERMS',
    severity: 'BLOCKING',
    description: 'Title and bullets must not contain prohibited promotional terms',
    field: 'title,bullets',
    policyUrl: 'https://sellercentral.amazon.com/help/hub/reference/G200390640',
    autoFixAvailable: true,
  },
  {
    ruleId: 'AMAZON_TITLE_BYTE_LIMIT',
    severity: 'ERROR',
    description: 'Title must not exceed 200 bytes (UTF-8)',
    field: 'title',
    autoFixAvailable: true,
  },
  {
    ruleId: 'AMAZON_BULLET_COUNT',
    severity: 'WARNING',
    description: 'Fewer than 3 bullets hurts conversion rate',
    field: 'bullets',
    autoFixAvailable: false,
  },
  {
    ruleId: 'AMAZON_BACKEND_KEYWORD_OVERLAP',
    severity: 'WARNING',
    description: 'Backend keywords should not duplicate words already in the title',
    field: 'backendKeywords',
    autoFixAvailable: true,
  },
  {
    ruleId: 'AMAZON_BRAND_REGISTRY',
    severity: 'INFO',
    description: 'Brand Registry enrollment preferred for enhanced content access',
    field: 'brand',
    autoFixAvailable: false,
  },
  {
    ruleId: 'AMAZON_IMAGE_RESOLUTION',
    severity: 'BLOCKING',
    description: 'Main image must be at least 1000px on shortest side',
    field: 'images[0]',
    autoFixAvailable: false,
  },
  {
    ruleId: 'AMAZON_CONDITION_REQUIRED',
    severity: 'BLOCKING',
    description: 'Item condition must be specified',
    field: 'condition',
    autoFixAvailable: false,
  },
  {
    ruleId: 'AMAZON_VARIATION_THEME',
    severity: 'WARNING',
    description: 'Variation theme should match category standard (e.g. SIZE_COLOR)',
    field: 'variations',
    autoFixAvailable: false,
  },
  {
    ruleId: 'AMAZON_DESCRIPTION_HTML',
    severity: 'WARNING',
    description: 'Description should use HTML <p> tags for formatting',
    field: 'description',
    autoFixAvailable: true,
  },
  {
    ruleId: 'AMAZON_IMAGE_TEXT_WATERMARK',
    severity: 'BLOCKING',
    description: 'Images must not contain text overlays or watermarks',
    field: 'images',
    autoFixAvailable: false,
  },
];

export const AMAZON_MANIFEST: ChannelManifest = {
  channel: 'AMAZON',
  titleLimit: AMAZON_TITLE_LIMIT,
  descriptionLimit: AMAZON_DESCRIPTION_LIMIT,
  mainImageRules: AMAZON_MAIN_IMAGE_RULES,
  gtinRequired: true,
  requiredFields: [...AMAZON_REQUIRED_FIELDS],
  prohibitedTerms: [...AMAZON_PROHIBITED_TERMS],
  complianceRules: AMAZON_COMPLIANCE_RULES,
};

export interface AmazonListingSchema {
  title: string;
  brand: string;
  manufacturer: string;
  product_type: string;
  item_type_keyword: string;
  bullet_points: string[];
  description: string;
  main_image_url: string;
  other_image_urls: string[];
  condition_type: 'New' | 'Refurbished' | 'Used';
  upc: string;
  item_specifics: Record<string, string>;
  keywords: string[];
  backend_keywords: string;
  category_path: string;
  variation_theme?: string;
}
