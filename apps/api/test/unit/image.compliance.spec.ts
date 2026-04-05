import { ImageComplianceService } from '../../src/vision/image-compliance.service';

describe('ImageComplianceService', () => {
  let service: ImageComplianceService;

  beforeEach(() => {
    service = new ImageComplianceService();
  });

  const baseMetadata = {
    width: 2000,
    height: 2000,
    hasWhiteBackground: true,
    hasTextOverlay: false,
    hasWatermark: false,
    blurScore: 0.1,
    fileSizeBytes: 500000,
    format: 'JPEG',
  };

  it('should pass compliant Amazon image', async () => {
    const result = await service.checkCompliance(baseMetadata, 'AMAZON');
    expect(result.passed).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it('should block non-white background for Amazon', async () => {
    const result = await service.checkCompliance(
      { ...baseMetadata, hasWhiteBackground: false },
      'AMAZON',
    );
    expect(result.passed).toBe(false);
    const bgViolation = result.violations.find(v => v.ruleId.includes('BACKGROUND'));
    expect(bgViolation).toBeDefined();
    expect(bgViolation?.autoFixAvailable).toBe(true);
  });

  it('should block low resolution for Amazon', async () => {
    const result = await service.checkCompliance(
      { ...baseMetadata, width: 500, height: 500 },
      'AMAZON',
    );
    expect(result.passed).toBe(false);
    const resViolation = result.violations.find(v => v.ruleId.includes('RESOLUTION'));
    expect(resViolation).toBeDefined();
  });

  it('should block text/watermark for Amazon', async () => {
    const result = await service.checkCompliance(
      { ...baseMetadata, hasTextOverlay: true },
      'AMAZON',
    );
    expect(result.passed).toBe(false);
  });

  it('should block oversized files for Amazon', async () => {
    const result = await service.checkCompliance(
      { ...baseMetadata, fileSizeBytes: 15 * 1024 * 1024 },
      'AMAZON',
    );
    const sizeViolation = result.violations.find(v => v.ruleId.includes('FILE_SIZE'));
    expect(sizeViolation).toBeDefined();
  });

  it('should pass for unknown channel', async () => {
    const result = await service.checkCompliance(baseMetadata, 'UNKNOWN');
    expect(result.passed).toBe(true);
  });

  it('should be lenient on eBay resolution', async () => {
    const result = await service.checkCompliance(
      { ...baseMetadata, width: 600, height: 600 },
      'EBAY',
    );
    expect(result.passed).toBe(true);
  });
});
