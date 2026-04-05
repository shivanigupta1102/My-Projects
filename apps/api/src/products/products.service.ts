import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/config/database.config';
import { CreateAttributeDto } from './dto/create-attribute.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { computeConfidence } from './confidence.scorer';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(organizationId: string, page = 1, limit = 20) {
    const where = { organizationId };
    const [total, items] = await this.prisma.$transaction([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { _count: { select: { attributes: true, evidenceRecords: true } } },
      }),
    ]);
    return {
      data: items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async getById(organizationId: string, id: string) {
    const p = await this.prisma.product.findFirst({
      where: { id, organizationId },
      include: {
        variants: { orderBy: { sortOrder: 'asc' } },
        attributes: true,
        evidenceRecords: true,
      },
    });
    if (!p) throw new NotFoundException('Product not found');
    return p;
  }

  async create(organizationId: string, dto: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        organizationId,
        title: dto.title,
        brand: dto.brand,
        status: 'DRAFT',
        reviewStatus: 'NEEDS_REVIEW',
      },
    });
  }

  async update(organizationId: string, id: string, dto: UpdateProductDto) {
    await this.ensureOrg(organizationId, id);
    return this.prisma.product.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.brand !== undefined ? { brand: dto.brand } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.reviewStatus !== undefined ? { reviewStatus: dto.reviewStatus } : {}),
        ...(dto.modelNumber !== undefined ? { modelNumber: dto.modelNumber } : {}),
        ...(dto.upc !== undefined ? { upc: dto.upc } : {}),
      },
    });
  }

  async remove(organizationId: string, id: string) {
    await this.ensureOrg(organizationId, id);
    await this.prisma.product.delete({ where: { id } });
  }

  async addAttribute(
    organizationId: string,
    productId: string,
    dto: CreateAttributeDto,
  ) {
    await this.ensureOrg(organizationId, productId);
    const scored = computeConfidence({
      modelConfidence: dto.confidence,
      method: dto.method,
      crossSourceAgreement: 0.85,
      schemaCompatibility: 0.9,
      sellerHistoryMatch: 0.7,
    });
    return this.prisma.attribute.create({
      data: {
        productId,
        fieldName: dto.fieldName,
        value: dto.value,
        normalizedValue: dto.normalizedValue ?? null,
        confidence: scored.confidence,
        method: dto.method,
        requiresReview: scored.requiresReview,
      },
    });
  }

  async linkEvidence(
    organizationId: string,
    productId: string,
    params: {
      attributeId?: string;
      sourceAssetId?: string;
      snippet?: string;
      explanation: string;
      confidence: number;
    },
  ) {
    await this.ensureOrg(organizationId, productId);
    return this.prisma.evidence.create({
      data: {
        productId,
        attributeId: params.attributeId,
        sourceAssetId: params.sourceAssetId,
        snippet: params.snippet,
        explanation: params.explanation,
        confidence: params.confidence,
      },
    });
  }

  async listAttributes(organizationId: string, productId: string) {
    await this.ensureOrg(organizationId, productId);
    return this.prisma.attribute.findMany({ where: { productId } });
  }

  async listEvidence(organizationId: string, productId: string) {
    await this.ensureOrg(organizationId, productId);
    return this.prisma.evidence.findMany({ where: { productId } });
  }

  private async ensureOrg(organizationId: string, productId: string): Promise<void> {
    const p = await this.prisma.product.findFirst({
      where: { id: productId, organizationId },
    });
    if (!p) throw new NotFoundException('Product not found');
  }

  assertOrg(productOrgId: string, userOrgId: string): void {
    if (productOrgId !== userOrgId) {
      throw new ForbiddenException('Organization mismatch');
    }
  }
}
