import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/config/database.config';

@Injectable()
export class EvidenceService {
  constructor(private readonly prisma: PrismaService) {}

  async list(organizationId: string, productId: string) {
    await this.ensureProduct(organizationId, productId);
    return this.prisma.evidence.findMany({ where: { productId } });
  }

  async getById(organizationId: string, id: string) {
    const e = await this.prisma.evidence.findFirst({
      where: { id, product: { organizationId } },
      include: { product: true },
    });
    if (!e) throw new NotFoundException('Evidence not found');
    return e;
  }

  async create(
    organizationId: string,
    data: {
      productId: string;
      attributeId?: string;
      sourceAssetId?: string;
      snippet?: string;
      explanation: string;
      confidence: number;
      regionJson?: Record<string, unknown>;
    },
  ) {
    await this.ensureProduct(organizationId, data.productId);
    return this.prisma.evidence.create({
      data: {
        productId: data.productId,
        attributeId: data.attributeId,
        sourceAssetId: data.sourceAssetId,
        snippet: data.snippet,
        explanation: data.explanation,
        confidence: data.confidence,
        regionJson: data.regionJson as object | undefined,
      },
    });
  }

  async update(
    organizationId: string,
    id: string,
    data: Partial<{
      snippet: string;
      explanation: string;
      confidence: number;
    }>,
  ) {
    await this.getById(organizationId, id);
    return this.prisma.evidence.update({
      where: { id },
      data: {
        ...(data.snippet !== undefined ? { snippet: data.snippet } : {}),
        ...(data.explanation !== undefined ? { explanation: data.explanation } : {}),
        ...(data.confidence !== undefined ? { confidence: data.confidence } : {}),
      },
    });
  }

  async remove(organizationId: string, id: string) {
    await this.getById(organizationId, id);
    await this.prisma.evidence.delete({ where: { id } });
  }

  private async ensureProduct(organizationId: string, productId: string): Promise<void> {
    const p = await this.prisma.product.findFirst({
      where: { id: productId, organizationId },
    });
    if (!p) throw new NotFoundException('Product not found');
  }
}
