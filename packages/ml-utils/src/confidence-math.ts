export interface ConfidenceWeightConfig {
  modelConfidence: number;
  sourceQuality: number;
  crossSourceAgreement: number;
  schemaCompatibility: number;
  evidenceSpecificity: number;
  sellerHistoryMatch: number;
}

export const DEFAULT_WEIGHTS: ConfidenceWeightConfig = {
  modelConfidence: 0.30,
  sourceQuality: 0.25,
  crossSourceAgreement: 0.20,
  schemaCompatibility: 0.10,
  evidenceSpecificity: 0.10,
  sellerHistoryMatch: 0.05,
};

export function computeWeightedConfidence(
  signals: Record<string, number>,
  weights: ConfidenceWeightConfig = DEFAULT_WEIGHTS,
): number {
  let totalWeight = 0;
  let weightedSum = 0;

  for (const [key, weight] of Object.entries(weights)) {
    const signal = signals[key];
    if (signal !== undefined && signal !== null) {
      weightedSum += signal * weight;
      totalWeight += weight;
    }
  }

  if (totalWeight === 0) return 0;
  return Math.round((weightedSum / totalWeight) * 1000) / 1000;
}

export function shouldRequireReview(
  method: string,
  confidence: number,
  conflicted: boolean,
  fieldName: string,
  safetyCriticalFields: readonly string[],
  preciseMeasurementFields: readonly string[],
): boolean {
  if (method === 'LLM_INFERENCE') return true;
  if (confidence < 0.60) return true;
  if (conflicted) return true;
  if (safetyCriticalFields.includes(fieldName)) return true;
  if (method === 'IMAGE_VISION' && preciseMeasurementFields.includes(fieldName)) return true;
  return false;
}

export const SOURCE_QUALITY_RANKS: Record<string, number> = {
  SELLER_CONFIRMED: 1.0,
  API_LOOKUP: 0.9,
  STRUCTURED_PARSE: 0.8,
  OCR: 0.7,
  URL_SCRAPE: 0.6,
  IMAGE_VISION: 0.5,
  PRIOR_LISTING: 0.4,
  LLM_INFERENCE: 0.3,
};
