import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { ReviewStatus } from '@prisma/client';
import { PrismaService } from '@/config/database.config';
import { CanonicalBuilder } from '@/products/canonical.builder';

export interface BuildCanonicalJobPayload {
  productId: string;
}

@Processor('build-canonical')
export class BuildCanonicalProcessor {
  private readonly logger = new Logger(BuildCanonicalProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly canonical: CanonicalBuilder,
  ) {}

  @Process('process')
  async handle(job: Job<BuildCanonicalJobPayload>): Promise<void> {
    const { productId } = job.data;
    const result = await this.canonical.buildForProduct(productId);
    await this.prisma.product.update({
      where: { id: productId },
      data: {
        completeness: result.completeness,
        canonicalJson: result as unknown as object,
        reviewStatus: result.needsReview
          ? ReviewStatus.NEEDS_REVIEW
          : ReviewStatus.IN_REVIEW,
      },
    });
    this.logger.log(`Canonical built for ${productId}`);
  }
}
