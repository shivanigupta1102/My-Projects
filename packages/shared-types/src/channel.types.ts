export type Channel = 'AMAZON' | 'EBAY' | 'WALMART' | 'SHOPIFY' | 'ETSY';

export type PackageStatus = 'DRAFT' | 'VALIDATED' | 'APPROVED' | 'PUBLISHED' | 'FAILED' | 'SUPPRESSED';

export type PublishStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'ROLLED_BACK';

export type MonitorStatus = 'ACTIVE' | 'PAUSED' | 'SUPPRESSED' | 'ERROR';

export type RemediationType = 'SUPPRESSION_FIX' | 'MISSING_REQUIRED' | 'CATEGORY_MISMATCH' | 'CONTENT_DRIFT' | 'DISCOVERABILITY' | 'CONVERSION';

export type RemediationStatus = 'OPEN' | 'APPLIED' | 'DISMISSED';

export type Severity = 'INFO' | 'WARNING' | 'ERROR' | 'BLOCKING';

export interface ListingPackageData {
  id: string;
  productId: string;
  channel: Channel;
  status: PackageStatus;
  title: string | null;
  bullets: string[];
  description: string | null;
  attributes: Record<string, unknown>;
  keywords: string[];
  images: ListingImage[];
  qualityScore: number | null;
}

export interface ListingImage {
  url: string;
  role: 'MAIN' | 'VARIANT' | 'LIFESTYLE' | 'INFOGRAPHIC';
  order: number;
}

export interface ValidationIssue {
  id: string;
  field: string;
  rule: string;
  severity: Severity;
  message: string;
  suggestedFix: string | null;
}

export interface QualityScore {
  total: number;
  breakdown: {
    requiredFieldCompleteness: number;
    categoryAccuracy: number;
    imageComplianceScore: number;
    attributeRichness: number;
    titleQuality: number;
    policyRiskPenalty: number;
    safetyCriticalReview: number;
  };
  issues: ValidationIssue[];
  readyToPublish: boolean;
}

export interface PublishResult {
  channelListingId: string | null;
  success: boolean;
  error: string | null;
  rawResponse: Record<string, unknown>;
}

export interface RemediationRecommendationData {
  id: string;
  monitorId: string;
  type: RemediationType;
  title: string;
  description: string;
  impactScore: number;
  suggestedFix: Record<string, unknown>;
  status: RemediationStatus;
}
