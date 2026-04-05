export type GtinType = 'UPC' | 'EAN' | 'ISBN' | 'GTIN_14';
export type GtinStatus = 'UNVERIFIED' | 'OWNER_CONFIRMED' | 'BRAND_REGISTRY' | 'EXEMPTION_GRANTED' | 'INVALID';
export type BrandRegistryStatus = 'NOT_REGISTERED' | 'PENDING' | 'REGISTERED' | 'UNKNOWN';

export interface GtinRecordData {
  id: string;
  gtin: string;
  gtinType: GtinType;
  verificationStatus: GtinStatus;
  verificationMethod?: string;
  brandName?: string;
  amazonBrandRegistryStatus: BrandRegistryStatus;
  exemptionReason?: string;
}
