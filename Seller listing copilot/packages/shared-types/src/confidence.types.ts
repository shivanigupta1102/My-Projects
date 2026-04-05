export interface ConfidenceSignals {
  modelConfidence: number;
  sourceQuality: number;
  crossSourceAgreement: number;
  schemaCompatibility: number;
  evidenceSpecificity: number;
  sellerHistoryMatch: number;
}

export interface ConfidenceWeights {
  modelConfidence: number;
  sourceQuality: number;
  crossSourceAgreement: number;
  schemaCompatibility: number;
  evidenceSpecificity: number;
  sellerHistoryMatch: number;
}

export const DEFAULT_CONFIDENCE_WEIGHTS: ConfidenceWeights = {
  modelConfidence: 0.30,
  sourceQuality: 0.25,
  crossSourceAgreement: 0.20,
  schemaCompatibility: 0.10,
  evidenceSpecificity: 0.10,
  sellerHistoryMatch: 0.05,
};

export const SAFETY_CRITICAL_FIELDS = [
  'weight', 'dimensions', 'voltage', 'wattage', 'amperage',
  'material_composition', 'country_of_origin', 'certifications',
  'compatibility', 'age_rating', 'hazmat_class',
] as const;

export const PRECISE_MEASUREMENT_FIELDS = [
  'weight', 'dimensions', 'voltage', 'wattage', 'amperage',
] as const;

export type ScoredAttribute = {
  fieldName: string;
  value: string;
  confidence: number;
  signals: ConfidenceSignals;
  requiresReview: boolean;
  reviewReason?: string;
};
