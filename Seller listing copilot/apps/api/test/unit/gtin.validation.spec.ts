import {
  validateGtin,
  validateGtinCheckDigit,
  identifyGtinType,
} from '@listingpilot/ml-utils';

describe('GTIN Validation', () => {
  describe('identifyGtinType', () => {
    it('should identify UPC (12 digits)', () => {
      expect(identifyGtinType('012345678905')).toBe('UPC');
    });

    it('should identify EAN (13 digits)', () => {
      expect(identifyGtinType('4006381333931')).toBe('EAN');
    });

    it('should identify GTIN-14', () => {
      expect(identifyGtinType('00012345678905')).toBe('GTIN_14');
    });

    it('should return UNKNOWN for invalid length', () => {
      expect(identifyGtinType('12345')).toBe('UNKNOWN');
    });

    it('should strip non-numeric characters', () => {
      expect(identifyGtinType('012-345-678905')).toBe('UPC');
    });
  });

  describe('validateGtinCheckDigit', () => {
    it('should validate correct UPC check digit', () => {
      expect(validateGtinCheckDigit('012345678905')).toBe(true);
    });

    it('should reject incorrect check digit', () => {
      expect(validateGtinCheckDigit('012345678901')).toBe(false);
    });

    it('should handle EAN-13', () => {
      expect(validateGtinCheckDigit('4006381333931')).toBe(true);
    });

    it('should reject too-short strings', () => {
      expect(validateGtinCheckDigit('1234')).toBe(false);
    });
  });

  describe('validateGtin', () => {
    it('should return valid for correct UPC', () => {
      const result = validateGtin('012345678905');
      expect(result.isValid).toBe(true);
      expect(result.gtinType).toBe('UPC');
      expect(result.checkDigitValid).toBe(true);
    });

    it('should return invalid for wrong check digit', () => {
      const result = validateGtin('012345678901');
      expect(result.isValid).toBe(false);
      expect(result.checkDigitValid).toBe(false);
    });

    it('should return error for empty string', () => {
      const result = validateGtin('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should return GS1 prefix info', () => {
      const result = validateGtin('012345678905');
      expect(result.gs1Prefix).toBeDefined();
    });
  });
});
