import { Injectable } from '@nestjs/common';

@Injectable()
export class NormalizerService {
  normalizeUnit(value: string, kind: 'length' | 'weight' | 'volume'): string {
    const v = value.trim().toLowerCase();
    if (kind === 'weight') {
      const oz = v.match(/([\d.]+)\s*oz/);
      const lb = v.match(/([\d.]+)\s*lb/);
      if (oz) return `${oz[1]} oz`;
      if (lb) return `${lb[1]} lb`;
    }
    if (kind === 'length') {
      const inch = v.match(/([\d.]+)\s*(in|"|inch|inches)/);
      const cm = v.match(/([\d.]+)\s*cm/);
      if (inch) return `${inch[1]} in`;
      if (cm) return `${cm[1]} cm`;
    }
    return value.trim();
  }

  normalizeColor(value: string): string {
    return value.trim().replace(/\s+/g, ' ');
  }

  normalizeMaterial(value: string): string {
    return value.trim().toLowerCase();
  }

  normalizeCondition(value: string): string {
    const v = value.trim().toLowerCase();
    if (['new', 'used', 'refurbished', 'open box'].includes(v)) {
      return v;
    }
    return value.trim();
  }
}
