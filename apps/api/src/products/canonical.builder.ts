import { Injectable } from '@nestjs/common';
import { Attribute, Evidence, ExtractionMethod, Product } from '@prisma/client';
import { PrismaService } from '@/config/database.config';
import { computeConfidence } from './confidence.scorer';
import { NormalizerService } from './normalizer.service';

export interface CanonicalField {
  fieldName: string;
  value: string;
  normalizedValue: string | null;
  confidence: number;
  method: ExtractionMethod;
  requiresReview: boolean;
  conflicted: boolean;
  winningEvidenceIds: string[];
}

export interface CanonicalBuildResult {
  fields: CanonicalField[];
  completeness: number;
  needsReview: boolean;
}

type AttrWithEvidence = Attribute & { evidence: Evidence[] };

@Injectable()
export class CanonicalBuilder {
  constructor(
    private readonly prisma: PrismaService,
    private readonly normalizer: NormalizerService,
  ) {}

  async buildForProduct(productId: string): Promise<CanonicalBuildResult> {
    const product = await this.prisma.product.findFirst({
      where: { id: productId },
      include: {
        attributes: { include: { evidence: true } },
      },
    });
    if (!product) {
      return { fields: [], completeness: 0, needsReview: true };
    }
    return this.mergeProduct(product);
  }

  mergeProduct(product: Product & { attributes: AttrWithEvidence[] }): CanonicalBuildResult {
    const byField = new Map<string, AttrWithEvidence[]>();
    for (const a of product.attributes) {
      const list = byField.get(a.fieldName) ?? [];
      list.push(a);
      byField.set(a.fieldName, list);
    }

    const fields: CanonicalField[] = [];
    for (const [fieldName, attrs] of byField) {
      const ranked = [...attrs].sort((a, b) => b.confidence - a.confidence);
      const top = ranked[0];
      if (!top) continue;
      const conflicted = ranked.length > 1 && ranked.some((x) => x.value !== top.value);
      const crossSourceAgreement = conflicted ? 0.4 : 0.95;
      const scored = computeConfidence({
        modelConfidence: top.confidence,
        method: top.method,
        crossSourceAgreement,
        schemaCompatibility: 0.9,
        sellerHistoryMatch: 0.75,
      });
      const normalizedValue = this.normalizeField(fieldName, top.value);
      fields.push({
        fieldName,
        value: top.value,
        normalizedValue,
        confidence: scored.confidence,
        method: top.method,
        requiresReview: scored.requiresReview || conflicted,
        conflicted,
        winningEvidenceIds: top.evidence.map((e) => e.id),
      });
    }

    const completeness =
      fields.length === 0
        ? 0
        : fields.filter((f) => f.confidence >= 0.7).length / Math.max(1, fields.length);
    const needsReview = fields.some((f) => f.requiresReview);

    return { fields, completeness, needsReview };
  }

  private normalizeField(fieldName: string, value: string): string | null {
    const lower = fieldName.toLowerCase();
    if (lower.includes('color')) {
      return this.normalizer.normalizeColor(value);
    }
    if (lower.includes('material')) {
      return this.normalizer.normalizeMaterial(value);
    }
    if (lower.includes('condition')) {
      return this.normalizer.normalizeCondition(value);
    }
    return value.trim();
  }
}
