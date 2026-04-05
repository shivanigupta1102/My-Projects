import { Channel, Severity } from '@prisma/client';
import { runValidation } from '@/listing-packages/validator/validation.engine';
import type { CanonicalFacts } from '@/listing-packages/generators/channel-generator.interface';

const emptyFacts = (): CanonicalFacts => ({
  title: null,
  brand: null,
  bullets: [],
  description: null,
  attributes: {},
  keywords: [],
  images: [],
});

describe('runValidation', () => {
  const titleLimits: Record<Channel, number> = {
    AMAZON: 200,
    EBAY: 80,
    WALMART: 200,
    SHOPIFY: 255,
    ETSY: 140,
  };

  it('required field missing → BLOCKING severity (Amazon brand)', () => {
    const facts: CanonicalFacts = {
      ...emptyFacts(),
      title: 'Valid title for amazon listing',
      attributes: {},
      images: [{ url: 'https://x', role: 'main', order: 0 }],
    };
    const q = runValidation(Channel.AMAZON, facts);
    const blocking = q.issues.filter((i) => i.severity === Severity.BLOCKING);
    expect(blocking.some((i) => i.rule === 'required-fields')).toBe(true);
    expect(q.readyToPublish).toBe(false);
  });

  it.each([
    [Channel.AMAZON],
    [Channel.EBAY],
    [Channel.WALMART],
    [Channel.SHOPIFY],
    [Channel.ETSY],
  ])('title over channel limit → ERROR severity (%s)', (channel) => {
    const max = titleLimits[channel];
    const facts: CanonicalFacts = {
      ...emptyFacts(),
      title: 'x'.repeat(max + 1),
      brand: 'Brand',
      attributes: { brand: 'Brand' },
      images: [{ url: 'https://x', role: 'main', order: 0 }],
    };
    const q = runValidation(channel, facts);
    const err = q.issues.find((i) => i.rule === 'title-length');
    expect(err?.severity).toBe(Severity.ERROR);
  });

  it('prohibited content detected → BLOCKING severity', () => {
    const facts: CanonicalFacts = {
      ...emptyFacts(),
      title: 'A fine product',
      brand: 'B',
      description: 'This is a best seller item',
      bullets: [],
      attributes: { brand: 'B' },
      images: [{ url: 'https://x', role: 'main', order: 0 }],
    };
    const q = runValidation(Channel.AMAZON, facts);
    expect(q.issues.some((i) => i.rule === 'prohibited-content' && i.severity === Severity.BLOCKING)).toBe(
      true,
    );
    expect(q.readyToPublish).toBe(false);
  });

  it('image below minimum → WARNING severity', () => {
    const facts: CanonicalFacts = {
      ...emptyFacts(),
      title: 'Twenty chars minimum ti',
      brand: 'B',
      attributes: { brand: 'B' },
      images: [],
    };
    const q = runValidation(Channel.AMAZON, facts);
    const img = q.issues.find((i) => i.rule === 'image-completeness');
    expect(img?.severity).toBe(Severity.WARNING);
  });

  it('all fields valid → qualityScore >= 0.85', () => {
    const attrs: Record<string, unknown> = {};
    for (let i = 0; i < 5; i += 1) {
      attrs[`attr${i}`] = `v${i}`;
    }
    attrs.brand = 'BrandCo';
    const facts: CanonicalFacts = {
      title: 'Twenty chars minimum ti',
      brand: 'BrandCo',
      bullets: [],
      description: 'Plain description without banned terms',
      attributes: attrs,
      keywords: [],
      images: [{ url: 'https://x', role: 'main', order: 0 }],
    };
    const q = runValidation(Channel.AMAZON, facts);
    expect(q.total).toBeGreaterThanOrEqual(0.85);
    expect(q.readyToPublish).toBe(true);
  });

  it('computes total from requiredFieldCompleteness*0.30 + categoryAccuracy*0.20 + attributeRichness*0.20 + imageComplianceScore*0.15 + titleQuality*0.10 - policyRiskPenalty', () => {
    const attrs: Record<string, unknown> = {};
    for (let i = 0; i < 5; i += 1) {
      attrs[`k${i}`] = 'v';
    }
    attrs.brand = 'B';
    const facts: CanonicalFacts = {
      title: 'Twenty chars minimum ti',
      brand: 'B',
      bullets: [],
      description: 'ok',
      attributes: attrs,
      keywords: [],
      images: [{ url: 'u', role: 'main', order: 0 }],
    };
    const q = runValidation(Channel.AMAZON, facts);
    const b = q.breakdown;
    const expected =
      b.requiredFieldCompleteness * 0.3 +
      b.categoryAccuracy * 0.2 +
      b.attributeRichness * 0.2 +
      b.imageComplianceScore * 0.15 +
      b.titleQuality * 0.1 -
      b.policyRiskPenalty;
    expect(q.total).toBeCloseTo(Math.max(0, Math.min(1, expected)), 10);
  });

  it('readyToPublish is true when total >= 0.70 and no blocking issues', () => {
    const attrs: Record<string, unknown> = { brand: 'B', a: 1, b: 2, c: 3, d: 4 };
    const facts: CanonicalFacts = {
      title: 'Twenty chars minimum ti',
      brand: 'B',
      bullets: [],
      description: 'safe text',
      attributes: attrs,
      keywords: [],
      images: [{ url: 'u', role: 'main', order: 0 }],
    };
    const q = runValidation(Channel.AMAZON, facts);
    expect(q.total).toBeGreaterThanOrEqual(0.7);
    expect(q.issues.every((i) => i.severity !== Severity.BLOCKING)).toBe(true);
    expect(q.readyToPublish).toBe(true);
  });

  it('readyToPublish is false when total >= 0.70 but blocking issues exist', () => {
    const attrs: Record<string, unknown> = { a: 1, b: 2, c: 3, d: 4, e: 5 };
    const facts: CanonicalFacts = {
      title: 'Twenty chars minimum ti',
      brand: null,
      bullets: [],
      description: 'safe',
      attributes: attrs,
      keywords: [],
      images: [{ url: 'u', role: 'main', order: 0 }],
    };
    const q = runValidation(Channel.AMAZON, facts);
    expect(q.total).toBeGreaterThanOrEqual(0.7);
    expect(q.issues.some((i) => i.severity === Severity.BLOCKING)).toBe(true);
    expect(q.readyToPublish).toBe(false);
  });

  it('policyRiskPenalty subtracts up to 0.30 from warnings', () => {
    const attrs: Record<string, unknown> = { brand: 'B' };
    const facts: CanonicalFacts = {
      title: 'Twenty chars minimum ti',
      brand: 'B',
      bullets: [],
      description: 'ok',
      attributes: attrs,
      keywords: [],
      images: [],
    };
    const q = runValidation(Channel.AMAZON, facts);
    expect(q.breakdown.policyRiskPenalty).toBeLessThanOrEqual(0.3);
    const warnings = q.issues.filter((i) => i.severity === Severity.WARNING).length;
    expect(q.breakdown.policyRiskPenalty).toBe(Math.min(0.3, warnings * 0.05));
  });
});
