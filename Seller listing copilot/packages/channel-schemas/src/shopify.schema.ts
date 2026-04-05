import { ChannelManifest, ComplianceRule, ImageRules } from './types';

export const SHOPIFY_TITLE_LIMIT = 255;
export const SHOPIFY_VARIANTS_MAX = 100;
export const SHOPIFY_SEO_TITLE_LIMIT = 70;
export const SHOPIFY_SEO_DESCRIPTION_LIMIT = 160;

export const SHOPIFY_MAIN_IMAGE_RULES: ImageRules = {
  minResolution: 800,
  allowedFormats: ['JPEG', 'PNG', 'GIF', 'WEBP'],
};

export const SHOPIFY_SALES_CHANNELS = [
  'online_store', 'pos', 'google', 'facebook',
] as const;

export const SHOPIFY_PRODUCT_STATUS = ['active', 'draft', 'archived'] as const;

export const SHOPIFY_COMPLIANCE_RULES: ComplianceRule[] = [
  {
    ruleId: 'SHOPIFY_TITLE_LIMIT',
    severity: 'BLOCKING',
    description: 'Title must not exceed 255 characters',
    field: 'title',
    autoFixAvailable: true,
  },
  {
    ruleId: 'SHOPIFY_SEO_TITLE_LIMIT',
    severity: 'WARNING',
    description: 'SEO title should be under 70 characters for optimal display',
    field: 'seoTitle',
    autoFixAvailable: true,
  },
  {
    ruleId: 'SHOPIFY_SEO_DESCRIPTION_LIMIT',
    severity: 'WARNING',
    description: 'SEO description should be under 160 characters',
    field: 'seoDescription',
    autoFixAvailable: true,
  },
  {
    ruleId: 'SHOPIFY_VARIANT_LIMIT',
    severity: 'BLOCKING',
    description: 'Product cannot exceed 100 variants',
    field: 'variants',
    autoFixAvailable: false,
  },
  {
    ruleId: 'SHOPIFY_DESCRIPTION_FORMAT',
    severity: 'WARNING',
    description: 'Description should be valid HTML for rich text display',
    field: 'description',
    autoFixAvailable: true,
  },
  {
    ruleId: 'SHOPIFY_IMAGE_REQUIRED',
    severity: 'WARNING',
    description: 'At least one product image recommended',
    field: 'images',
    autoFixAvailable: false,
  },
];

export const SHOPIFY_MANIFEST: ChannelManifest = {
  channel: 'SHOPIFY',
  titleLimit: SHOPIFY_TITLE_LIMIT,
  descriptionLimit: Infinity,
  mainImageRules: SHOPIFY_MAIN_IMAGE_RULES,
  gtinRequired: false,
  requiredFields: ['title', 'description', 'price'],
  prohibitedTerms: [],
  complianceRules: SHOPIFY_COMPLIANCE_RULES,
};

export interface ShopifyVariantSchema {
  sku?: string;
  price: number;
  compareAtPrice?: number;
  inventoryQuantity: number;
  weight?: number;
  weightUnit?: 'kg' | 'g' | 'lb' | 'oz';
  options: Record<string, string>;
  barcode?: string;
  inventoryPolicy: 'deny' | 'continue';
  inventoryManagement: 'shopify' | 'external' | null;
}

export interface ShopifyListingSchema {
  title: string;
  description: string;
  vendor: string;
  productType: string;
  tags: string[];
  status: typeof SHOPIFY_PRODUCT_STATUS[number];
  variants: ShopifyVariantSchema[];
  images: string[];
  seoTitle: string;
  seoDescription: string;
  metafields: Record<string, unknown>;
  publishToChannels: Array<typeof SHOPIFY_SALES_CHANNELS[number]>;
}
