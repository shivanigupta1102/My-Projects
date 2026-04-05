import { RemediationType } from '@prisma/client';
import {
  rankRemediationImpact,
  rankRemediationItems,
  type RemediationRankable,
} from '@/monitoring/remediation.engine';

describe('rankRemediationImpact', () => {
  it('SUPPRESSION_FIX is highest impact band (90–100)', () => {
    expect(rankRemediationImpact(RemediationType.SUPPRESSION_FIX)).toBeGreaterThanOrEqual(90);
    expect(rankRemediationImpact(RemediationType.SUPPRESSION_FIX)).toBeLessThanOrEqual(100);
  });

  it('MISSING_REQUIRED is second band (70–90)', () => {
    expect(rankRemediationImpact(RemediationType.MISSING_REQUIRED)).toBeGreaterThanOrEqual(70);
    expect(rankRemediationImpact(RemediationType.MISSING_REQUIRED)).toBeLessThan(90);
  });

  it('CATEGORY_MISMATCH is third band (60–80)', () => {
    expect(rankRemediationImpact(RemediationType.CATEGORY_MISMATCH)).toBeGreaterThanOrEqual(60);
    expect(rankRemediationImpact(RemediationType.CATEGORY_MISMATCH)).toBeLessThan(80);
  });

  it('DISCOVERABILITY is fourth band (30–60)', () => {
    expect(rankRemediationImpact(RemediationType.DISCOVERABILITY)).toBeGreaterThanOrEqual(30);
    expect(rankRemediationImpact(RemediationType.DISCOVERABILITY)).toBeLessThanOrEqual(60);
  });

  it('CONVERSION is last band (10–30)', () => {
    expect(rankRemediationImpact(RemediationType.CONVERSION)).toBeGreaterThanOrEqual(10);
    expect(rankRemediationImpact(RemediationType.CONVERSION)).toBeLessThanOrEqual(30);
  });

  it('strict ordering: SUPPRESSION > MISSING > CATEGORY > CONTENT_DRIFT > DISCOVERABILITY > CONVERSION', () => {
    const s = rankRemediationImpact(RemediationType.SUPPRESSION_FIX);
    const m = rankRemediationImpact(RemediationType.MISSING_REQUIRED);
    const c = rankRemediationImpact(RemediationType.CATEGORY_MISMATCH);
    const d = rankRemediationImpact(RemediationType.CONTENT_DRIFT);
    const di = rankRemediationImpact(RemediationType.DISCOVERABILITY);
    const co = rankRemediationImpact(RemediationType.CONVERSION);
    expect(s).toBeGreaterThan(m);
    expect(m).toBeGreaterThan(c);
    expect(c).toBeGreaterThan(d);
    expect(d).toBeGreaterThan(di);
    expect(di).toBeGreaterThan(co);
  });
});

describe('rankRemediationItems', () => {
  const item = (
    id: string,
    type: RemediationType,
    dismissed?: boolean,
  ): RemediationRankable => ({ id, type, dismissed });

  it('empty input returns empty output', () => {
    expect(rankRemediationItems([])).toEqual([]);
  });

  it('single recommendation returns as-is', () => {
    const one = item('1', RemediationType.CONVERSION);
    expect(rankRemediationItems([one])).toEqual([one]);
  });

  it('dismissed recommendations are excluded', () => {
    const ranked = rankRemediationItems([
      item('1', RemediationType.CONVERSION, true),
      item('2', RemediationType.SUPPRESSION_FIX),
    ]);
    expect(ranked.map((r) => r.id)).toEqual(['2']);
  });

  it('sorts by impact descending with expected type order', () => {
    const ranked = rankRemediationItems([
      item('a', RemediationType.CONVERSION),
      item('b', RemediationType.SUPPRESSION_FIX),
      item('c', RemediationType.MISSING_REQUIRED),
    ]);
    expect(ranked.map((r) => r.type)).toEqual([
      RemediationType.SUPPRESSION_FIX,
      RemediationType.MISSING_REQUIRED,
      RemediationType.CONVERSION,
    ]);
  });

  it('equal impact preserves insertion order (stable sort)', () => {
    const ranked = rankRemediationItems([
      item('first', RemediationType.CONVERSION),
      item('second', RemediationType.CONVERSION),
    ]);
    expect(ranked.map((r) => r.id)).toEqual(['first', 'second']);
  });
});
