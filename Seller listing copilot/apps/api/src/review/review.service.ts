import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ReviewQueueItem } from '@listingpilot/shared-types';
import { PrismaService } from '@/config/database.config';

@Injectable()
export class ReviewService {
  constructor(private readonly prisma: PrismaService) {}

  async getQueue(organizationId: string): Promise<ReviewQueueItem[]> {
    const attrs = await this.prisma.attribute.findMany({
      where: {
        product: { organizationId },
        requiresReview: true,
        approvedAt: null,
      },
      include: {
        product: true,
        evidence: true,
      },
      orderBy: [{ confidence: 'asc' }, { updatedAt: 'asc' }],
    });

    return attrs.map((a) => ({
      attributeId: a.id,
      productId: a.productId,
      productTitle: a.product.title ?? '(untitled)',
      fieldName: a.fieldName,
      value: a.value,
      confidence: a.confidence,
      method: a.method,
      conflicted: a.conflicted,
      evidenceCount: a.evidence.length,
    }));
  }

  async approve(organizationId: string, attributeId: string) {
    const attr = await this.prisma.attribute.findFirst({
      where: { id: attributeId, product: { organizationId } },
    });
    if (!attr) throw new NotFoundException('Attribute not found');
    if (attr.confidence < 0.6) {
      throw new BadRequestException(
        'Cannot approve attributes with confidence below 0.60',
      );
    }
    return this.prisma.attribute.update({
      where: { id: attributeId },
      data: { requiresReview: false, approvedAt: new Date(), conflicted: false },
    });
  }

  async override(
    organizationId: string,
    attributeId: string,
    value: string,
    normalizedValue?: string,
  ) {
    const attr = await this.prisma.attribute.findFirst({
      where: { id: attributeId, product: { organizationId } },
    });
    if (!attr) throw new NotFoundException('Attribute not found');
    return this.prisma.attribute.update({
      where: { id: attributeId },
      data: {
        value,
        normalizedValue: normalizedValue ?? value,
        requiresReview: false,
        approvedAt: new Date(),
        method: 'SELLER_CONFIRMED',
        confidence: 1,
      },
    });
  }

  async bulkApprove(organizationId: string, attributeIds: string[]) {
    const attrs = await this.prisma.attribute.findMany({
      where: {
        id: { in: attributeIds },
        product: { organizationId },
      },
    });
    const low = attrs.filter((a) => a.confidence < 0.6);
    if (low.length > 0) {
      throw new BadRequestException(
        `Cannot approve ${low.length} attribute(s) below 0.60 confidence`,
      );
    }
    await this.prisma.attribute.updateMany({
      where: {
        id: { in: attributeIds },
        product: { organizationId },
      },
      data: {
        requiresReview: false,
        approvedAt: new Date(),
        conflicted: false,
      },
    });
    return { updated: attrs.length };
  }
}
