import { ConfidenceSignals } from '@listingpilot/shared-types';
import { ExtractionMethod } from '@prisma/client';

export const SOURCE_QUALITY: Record<ExtractionMethod, number> = {
  SELLER_CONFIRMED: 1.0,
  API_LOOKUP: 0.95,
  STRUCTURED_PARSE: 0.85,
  OCR: 0.8,
  URL_SCRAPE: 0.7,
  IMAGE_VISION: 0.65,
  PRIOR_LISTING: 0.6,
  LLM_INFERENCE: 0.3,
};

export interface ScoreInput {
  modelConfidence: number;
  method: ExtractionMethod;
  crossSourceAgreement: number;
  schemaCompatibility: number;
  sellerHistoryMatch: number;
  /** When omitted, a neutral default is used for the signal only (confidence weights unchanged). */
  evidenceSpecificity?: number;
}

export interface ScoreResult {
  confidence: number;
  requiresReview: boolean;
  signals: ConfidenceSignals;
}

export function computeConfidence(input: ScoreInput): ScoreResult {
  const sourceQuality = SOURCE_QUALITY[input.method];
  const evidenceSpecificity = input.evidenceSpecificity ?? 0.7;
  const signals: ConfidenceSignals = {
    modelConfidence: input.modelConfidence,
    sourceQuality,
    crossSourceAgreement: input.crossSourceAgreement,
    schemaCompatibility: input.schemaCompatibility,
    evidenceSpecificity,
    sellerHistoryMatch: input.sellerHistoryMatch,
  };
  const confidence =
    input.modelConfidence * 0.35 +
    sourceQuality * 0.25 +
    input.crossSourceAgreement * 0.2 +
    input.schemaCompatibility * 0.1 +
    input.sellerHistoryMatch * 0.1;
  const clamped = Math.min(1, Math.max(0, confidence));
  const requiresReview =
    input.method === 'LLM_INFERENCE' || clamped < 0.6;
  return {
    confidence: clamped,
    requiresReview,
    signals,
  };
}
