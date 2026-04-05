import { ComplianceEngine } from '../../src/compliance/compliance.engine';

describe('ComplianceEngine', () => {
  let engine: ComplianceEngine;

  beforeEach(() => {
    engine = new ComplianceEngine();
  });

  describe('Amazon rules', () => {
    it('should block when GTIN is missing', async () => {
      const report = await engine.runComplianceChecks({ title: 'Test Product' }, 'AMAZON');
      const gtinCheck = report.checks.find(c => c.ruleId === 'AMAZON_GTIN_REQUIRED');
      expect(gtinCheck).toBeDefined();
      expect(gtinCheck?.severity).toBe('BLOCKING');
      expect(report.gate).toBe('BLOCKED');
    });

    it('should pass when GTIN is present', async () => {
      const report = await engine.runComplianceChecks(
        { title: 'Test', gtin: '027242923539' },
        'AMAZON',
      );
      const gtinCheck = report.checks.find(c => c.ruleId === 'AMAZON_GTIN_REQUIRED');
      expect(gtinCheck).toBeUndefined();
    });

    it('should flag title exceeding 200 bytes', async () => {
      const longTitle = 'A'.repeat(201);
      const report = await engine.runComplianceChecks(
        { title: longTitle, gtin: '123456789012' },
        'AMAZON',
      );
      const titleCheck = report.checks.find(c => c.ruleId === 'AMAZON_TITLE_BYTE_LIMIT');
      expect(titleCheck).toBeDefined();
      expect(titleCheck?.severity).toBe('ERROR');
    });

    it('should pass title within byte limit', async () => {
      const report = await engine.runComplianceChecks(
        { title: 'Short Title', gtin: '123456789012' },
        'AMAZON',
      );
      const titleCheck = report.checks.find(c => c.ruleId === 'AMAZON_TITLE_BYTE_LIMIT');
      expect(titleCheck).toBeUndefined();
    });

    it('should count blocking vs warning checks correctly', async () => {
      const report = await engine.runComplianceChecks({ title: 'Test' }, 'AMAZON');
      expect(report.blockingCount).toBeGreaterThanOrEqual(0);
      expect(report.warningCount).toBeGreaterThanOrEqual(0);
      expect(report.blockingCount + report.warningCount).toBeLessThanOrEqual(report.checks.length);
    });
  });

  describe('Etsy rules', () => {
    it('should block when tag count is not exactly 13', async () => {
      const report = await engine.runComplianceChecks(
        { tags: ['tag1', 'tag2', 'tag3'] },
        'ETSY',
      );
      const tagCheck = report.checks.find(c => c.ruleId === 'ETSY_TAG_COUNT_EXACT');
      expect(tagCheck).toBeDefined();
      expect(tagCheck?.severity).toBe('BLOCKING');
    });

    it('should pass when tag count is exactly 13', async () => {
      const tags = Array.from({ length: 13 }, (_, i) => `tag${i + 1}`);
      const report = await engine.runComplianceChecks({ tags }, 'ETSY');
      const tagCheck = report.checks.find(c => c.ruleId === 'ETSY_TAG_COUNT_EXACT');
      expect(tagCheck).toBeUndefined();
    });

    it('should block AI disclosure when AI content present without disclosure', async () => {
      const report = await engine.runComplianceChecks(
        { hasAiGeneratedContent: true, description: 'Regular description' },
        'ETSY',
      );
      const disclosure = report.checks.find(c => c.ruleId === 'ETSY_AI_DISCLOSURE_REQUIRED');
      expect(disclosure).toBeDefined();
      expect(disclosure?.autoFixAvailable).toBe(true);
    });

    it('should pass AI disclosure when disclosure text present', async () => {
      const report = await engine.runComplianceChecks(
        { hasAiGeneratedContent: true, description: 'Created with AI assistance' },
        'ETSY',
      );
      const disclosure = report.checks.find(c => c.ruleId === 'ETSY_AI_DISCLOSURE_REQUIRED');
      expect(disclosure).toBeUndefined();
    });
  });

  describe('Unknown channel', () => {
    it('should return PASSED for unknown channel', async () => {
      const report = await engine.runComplianceChecks({ title: 'Test' }, 'UNKNOWN');
      expect(report.gate).toBe('PASSED');
      expect(report.checks).toHaveLength(0);
    });
  });
});
