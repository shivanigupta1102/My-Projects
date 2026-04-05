export interface ImageRules {
  background?: 'pure_white' | 'any';
  minResolution: number;
  maxFileSize?: number;
  allowedFormats?: string[];
  noTextOrWatermarks?: boolean;
  noPropsOrMannequins?: boolean;
  noStockPhotoWatermarks?: boolean;
  selfHostedAllowed?: boolean;
}

export interface VariationRules {
  maxOptions?: number;
  maxValues?: number;
  theme?: string;
}

export interface ComplianceRule {
  ruleId: string;
  severity: 'BLOCKING' | 'ERROR' | 'WARNING' | 'INFO';
  description: string;
  field: string;
  policyUrl?: string;
  autoFixAvailable: boolean;
}

export interface ChannelManifest {
  channel: 'AMAZON' | 'EBAY' | 'ETSY' | 'SHOPIFY' | 'WALMART';
  titleLimit: number;
  descriptionLimit: number;
  mainImageRules: ImageRules;
  gtinRequired: boolean;
  requiredFields: string[];
  prohibitedTerms: string[];
  complianceRules: ComplianceRule[];
}
