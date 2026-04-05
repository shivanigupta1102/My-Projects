import { ChannelManifest, ComplianceRule, ImageRules } from './types';

export const ETSY_TITLE_LIMIT = 140;
export const ETSY_TAG_COUNT = 13;
export const ETSY_TAG_CHAR_LIMIT = 20;
export const ETSY_DESCRIPTION_LIMIT = 65535;
export const ETSY_IMAGE_LIMIT = 10;

export const ETSY_MAIN_IMAGE_RULES: ImageRules = {
  minResolution: 2000,
  allowedFormats: ['JPEG', 'PNG', 'GIF'],
};

export const ETSY_VARIATION_RULES = {
  maxOptions: 2,
  maxValues: 70,
} as const;

export const ETSY_RENEWAL_OPTIONS = ['automatic', 'manual'] as const;
export const ETSY_WHO_MADE = ['i_did', 'someone_else', 'collective'] as const;
export const ETSY_WHEN_MADE = [
  'made_to_order', '2020_2025', '2010_2019', '2004_2009',
  'before_2004', '2000_2003', '1990s', '1980s', '1970s',
  '1960s', '1950s', '1940s', '1930s', '1920s', '1910s', '1900s',
] as const;

export const ETSY_COMPLIANCE_RULES: ComplianceRule[] = [
  {
    ruleId: 'ETSY_TAG_COUNT_EXACT',
    severity: 'BLOCKING',
    description: 'Etsy requires exactly 13 tags for optimal search visibility',
    field: 'tags',
    policyUrl: 'https://help.etsy.com/hc/en-us/articles/115015672808',
    autoFixAvailable: true,
  },
  {
    ruleId: 'ETSY_AI_DISCLOSURE_REQUIRED',
    severity: 'BLOCKING',
    description: 'Listings with AI-generated content must include disclosure',
    field: 'description',
    policyUrl: 'https://www.etsy.com/legal/policy/artificial-intelligence/1705933392427',
    autoFixAvailable: true,
  },
  {
    ruleId: 'ETSY_TAG_CHAR_LIMIT',
    severity: 'ERROR',
    description: 'Each tag must not exceed 20 characters',
    field: 'tags',
    autoFixAvailable: true,
  },
  {
    ruleId: 'ETSY_TITLE_LIMIT',
    severity: 'BLOCKING',
    description: 'Title must not exceed 140 characters',
    field: 'title',
    autoFixAvailable: true,
  },
  {
    ruleId: 'ETSY_WHO_MADE_REQUIRED',
    severity: 'BLOCKING',
    description: 'who_made field is required',
    field: 'who_made',
    autoFixAvailable: false,
  },
  {
    ruleId: 'ETSY_WHEN_MADE_REQUIRED',
    severity: 'BLOCKING',
    description: 'when_made field is required',
    field: 'when_made',
    autoFixAvailable: false,
  },
  {
    ruleId: 'ETSY_IMAGE_COUNT',
    severity: 'WARNING',
    description: 'Using all 10 image slots improves conversion',
    field: 'images',
    autoFixAvailable: false,
  },
  {
    ruleId: 'ETSY_PROHIBITED_CATEGORY',
    severity: 'BLOCKING',
    description: 'Product falls in a prohibited category (weapons, medical claims)',
    field: 'category',
    autoFixAvailable: false,
  },
];

export const ETSY_MANIFEST: ChannelManifest = {
  channel: 'ETSY',
  titleLimit: ETSY_TITLE_LIMIT,
  descriptionLimit: ETSY_DESCRIPTION_LIMIT,
  mainImageRules: ETSY_MAIN_IMAGE_RULES,
  gtinRequired: false,
  requiredFields: ['title', 'description', 'price', 'who_made', 'when_made', 'tags', 'images'],
  prohibitedTerms: [],
  complianceRules: ETSY_COMPLIANCE_RULES,
};

export interface EtsyListingSchema {
  title: string;
  description: string;
  tags: string[];
  price: number;
  currency: string;
  quantity: number;
  who_made: typeof ETSY_WHO_MADE[number];
  when_made: typeof ETSY_WHEN_MADE[number];
  is_supply: boolean;
  should_auto_renew: boolean;
  images: string[];
  materials?: string[];
  variations?: Array<{ property: string; values: string[] }>;
  ai_disclosure_suffix?: string;
}
