export type GtinType = 'UPC' | 'EAN' | 'ISBN' | 'GTIN_14' | 'UNKNOWN';

export interface GtinValidationResult {
  isValid: boolean;
  gtinType: GtinType;
  checkDigitValid: boolean;
  gs1Prefix?: string;
  gs1Country?: string;
  error?: string;
}

export function identifyGtinType(gtin: string): GtinType {
  const cleaned = gtin.replace(/[^0-9]/g, '');
  switch (cleaned.length) {
    case 10:
      return 'ISBN';
    case 12:
      return 'UPC';
    case 13:
      return cleaned.startsWith('978') || cleaned.startsWith('979') ? 'ISBN' : 'EAN';
    case 14:
      return 'GTIN_14';
    default:
      return 'UNKNOWN';
  }
}

export function validateGtinCheckDigit(gtin: string): boolean {
  const cleaned = gtin.replace(/[^0-9]/g, '');
  if (cleaned.length < 8 || cleaned.length > 14) return false;

  const padded = cleaned.padStart(14, '0');
  const digits = padded.split('').map(Number);
  const checkDigit = digits[13];

  let sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += digits[i] * (i % 2 === 0 ? 3 : 1);
  }

  const calculated = (10 - (sum % 10)) % 10;
  return calculated === checkDigit;
}

export function validateGtin(gtin: string): GtinValidationResult {
  const cleaned = gtin.replace(/[^0-9]/g, '');

  if (cleaned.length === 0) {
    return { isValid: false, gtinType: 'UNKNOWN', checkDigitValid: false, error: 'Empty GTIN' };
  }

  const gtinType = identifyGtinType(cleaned);
  if (gtinType === 'UNKNOWN') {
    return { isValid: false, gtinType, checkDigitValid: false, error: `Invalid length: ${cleaned.length}` };
  }

  const checkDigitValid = validateGtinCheckDigit(cleaned);
  const gs1Prefix = cleaned.length >= 3 ? cleaned.substring(0, 3) : undefined;
  const gs1Country = gs1Prefix ? lookupGs1Country(gs1Prefix) : undefined;

  return {
    isValid: checkDigitValid,
    gtinType,
    checkDigitValid,
    gs1Prefix,
    gs1Country,
  };
}

const GS1_PREFIXES: Record<string, string> = {
  '000': 'US/Canada', '001': 'US/Canada', '002': 'US/Canada',
  '030': 'US/Canada', '060': 'US/Canada', '070': 'US/Canada',
  '400': 'Germany', '401': 'Germany', '402': 'Germany',
  '450': 'Japan', '500': 'UK', '690': 'China', '691': 'China',
  '880': 'South Korea', '890': 'India', '978': 'ISBN',
};

function lookupGs1Country(prefix: string): string | undefined {
  for (const [key, country] of Object.entries(GS1_PREFIXES)) {
    if (prefix.startsWith(key)) return country;
  }
  return undefined;
}
