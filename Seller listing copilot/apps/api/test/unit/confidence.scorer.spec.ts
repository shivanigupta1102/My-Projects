import { ExtractionMethod } from '@prisma/client';
import {
  SOURCE_QUALITY,
  computeConfidence,
  type ScoreInput,
} from '@/products/confidence.scorer';

describe('computeConfidence', () => {
  const baseInput = (): ScoreInput => ({
    modelConfidence: 1,
    method: ExtractionMethod.SELLER_CONFIRMED,
    crossSourceAgreement: 1,
    schemaCompatibility: 1,
    sellerHistoryMatch: 1,
  });

  it('combines signals per formula: model*0.35 + source*0.25 + cross*0.2 + schema*0.1 + history*0.1', () => {
    const input: ScoreInput = {
      modelConfidence: 0.8,
      method: ExtractionMethod.API_LOOKUP,
      crossSourceAgreement: 0.5,
      schemaCompatibility: 0.6,
      sellerHistoryMatch: 0.7,
    };
    const sq = SOURCE_QUALITY[input.method];
    const expected =
      input.modelConfidence * 0.35 +
      sq * 0.25 +
      input.crossSourceAgreement * 0.2 +
      input.schemaCompatibility * 0.1 +
      input.sellerHistoryMatch * 0.1;
    const { confidence } = computeConfidence(input);
    expect(confidence).toBeCloseTo(expected, 10);
  });

  it('LLM_INFERENCE always sets requiresReview true even at high model confidence', () => {
    const r = computeConfidence({
      modelConfidence: 1,
      method: ExtractionMethod.LLM_INFERENCE,
      crossSourceAgreement: 1,
      schemaCompatibility: 1,
      sellerHistoryMatch: 1,
    });
    expect(r.requiresReview).toBe(true);
  });

  it('low crossSourceAgreement lowers the combined confidence vs high agreement', () => {
    const high = computeConfidence({
      ...baseInput(),
      crossSourceAgreement: 1,
    });
    const low = computeConfidence({
      ...baseInput(),
      crossSourceAgreement: 0.2,
    });
    expect(low.confidence).toBeLessThan(high.confidence);
  });

  it.each([
    [ExtractionMethod.SELLER_CONFIRMED, 1.0],
    [ExtractionMethod.API_LOOKUP, 0.95],
    [ExtractionMethod.STRUCTURED_PARSE, 0.85],
    [ExtractionMethod.OCR, 0.8],
    [ExtractionMethod.IMAGE_VISION, 0.65],
    [ExtractionMethod.LLM_INFERENCE, 0.3],
  ] as const)('source quality for %s is %s', (method, expectedSq) => {
    const { signals } = computeConfidence({
      modelConfidence: 1,
      method,
      crossSourceAgreement: 1,
      schemaCompatibility: 1,
      sellerHistoryMatch: 1,
    });
    expect(signals.sourceQuality).toBeCloseTo(expectedSq, 8);
  });

  it('maps all extraction methods to SOURCE_QUALITY exactly', () => {
    expect(SOURCE_QUALITY).toEqual({
      SELLER_CONFIRMED: 1.0,
      API_LOOKUP: 0.95,
      STRUCTURED_PARSE: 0.85,
      OCR: 0.8,
      URL_SCRAPE: 0.7,
      IMAGE_VISION: 0.65,
      PRIOR_LISTING: 0.6,
      LLM_INFERENCE: 0.3,
    });
  });

  it('high signals (all 1.0) yields confidence near 1.0', () => {
    const { confidence } = computeConfidence(baseInput());
    expect(confidence).toBeGreaterThan(0.99);
  });

  it('low signals (all 0 except sourceQuality from method) yields confidence near 0.0', () => {
    const { confidence } = computeConfidence({
      modelConfidence: 0,
      method: ExtractionMethod.LLM_INFERENCE,
      crossSourceAgreement: 0,
      schemaCompatibility: 0,
      sellerHistoryMatch: 0,
    });
    expect(confidence).toBeLessThan(0.15);
  });

  it('mixed signals produce the correct weighted average', () => {
    const input: ScoreInput = {
      modelConfidence: 0.5,
      method: ExtractionMethod.STRUCTURED_PARSE,
      crossSourceAgreement: 0.75,
      schemaCompatibility: 0.4,
      sellerHistoryMatch: 0.2,
    };
    const sq = SOURCE_QUALITY[input.method];
    const expected =
      0.5 * 0.35 +
      sq * 0.25 +
      0.75 * 0.2 +
      0.4 * 0.1 +
      0.2 * 0.1;
    expect(computeConfidence(input).confidence).toBeCloseTo(expected, 10);
  });
});
