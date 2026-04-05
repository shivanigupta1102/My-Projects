export type ProductStatus = 'DRAFT' | 'REVIEW_READY' | 'APPROVED' | 'PUBLISHED' | 'ARCHIVED';
export type ReviewStatus = 'NEEDS_REVIEW' | 'IN_REVIEW' | 'APPROVED';

export interface CanonicalProduct {
  id: string;
  organizationId: string;
  title: string | null;
  brand: string | null;
  modelNumber: string | null;
  upc: string | null;
  ean: string | null;
  asin: string | null;
  status: ProductStatus;
  reviewStatus: ReviewStatus;
  completeness: number;
  attributes: ProductAttribute[];
  variants: ProductVariant[];
  gtinRecord?: import('./gtin.types').GtinRecordData;
  categoryMappings: import('./category.types').CategoryMappingData[];
  images: import('./image.types').ImageAssetData[];
  channelSpecificOverrides: Record<string, Record<string, string>>;
}

export interface ProductAttribute {
  id: string;
  fieldName: string;
  value: string;
  normalizedValue: string | null;
  confidence: number;
  method: ExtractionMethod;
  requiresReview: boolean;
  approvedAt: string | null;
  evidences: EvidenceRecord[];
}

export interface ProductVariant {
  id: string;
  sku: string | null;
  title: string;
  attributes: Record<string, string>;
}

export interface EvidenceRecord {
  id: string;
  sourceAssetId: string;
  snippet: string | null;
  explanation: string;
  confidence: number;
}

export type ExtractionMethod =
  | 'OCR'
  | 'IMAGE_VISION'
  | 'LLM_INFERENCE'
  | 'STRUCTURED_PARSE'
  | 'URL_SCRAPE'
  | 'API_LOOKUP'
  | 'SELLER_CONFIRMED'
  | 'PRIOR_LISTING';
