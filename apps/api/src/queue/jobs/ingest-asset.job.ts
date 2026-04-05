import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { createHash } from 'crypto';
import {
  AssetType,
  ExtractionMethod,
  IngestionStatus,
  ProductStatus,
  ReviewStatus,
} from '@prisma/client';
import { PrismaService } from '@/config/database.config';
import { CsvProcessor } from '@/ingestion/processors/csv.processor';
import { ImageProcessor } from '@/ingestion/processors/image.processor';
import { PdfProcessor } from '@/ingestion/processors/pdf.processor';
import { StorageService } from '@/storage/storage.service';

export interface IngestAssetJobPayload {
  organizationId: string;
  ingestionJobId: string;
  sourceAssetId: string;
}

@Processor('ingest-asset')
export class IngestAssetProcessor {
  private readonly logger = new Logger(IngestAssetProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly image: ImageProcessor,
    private readonly csv: CsvProcessor,
    private readonly pdf: PdfProcessor,
  ) {}

  @Process('process')
  async handle(job: Job<IngestAssetJobPayload>): Promise<void> {
    const { organizationId, ingestionJobId, sourceAssetId } = job.data;
    await this.prisma.ingestionJob.updateMany({
      where: { id: ingestionJobId, status: IngestionStatus.PENDING },
      data: { status: IngestionStatus.PROCESSING },
    });
    const asset = await this.prisma.sourceAsset.findFirst({
      where: { id: sourceAssetId, ingestionJobId },
    });
    if (!asset) {
      this.logger.warn('Source asset missing');
      return;
    }

    const buffer = await this.storage.getObjectBuffer(asset.storageKey);
    const fileHash = createHash('sha256').update(buffer).digest('hex');

    let product = await this.prisma.product.findFirst({
      where: { ingestionJobId },
    });
    if (!product) {
      product = await this.prisma.product.create({
        data: {
          organizationId,
          ingestionJobId,
          title: asset.originalFilename,
          status: ProductStatus.DRAFT,
          reviewStatus: ReviewStatus.NEEDS_REVIEW,
        },
      });
    }

    const prevMeta =
      asset.metadataJson && typeof asset.metadataJson === 'object'
        ? (asset.metadataJson as Record<string, unknown>)
        : {};
    await this.prisma.sourceAsset.update({
      where: { id: asset.id },
      data: {
        checksumSha256: fileHash,
        metadataJson: { ...prevMeta, fileHash },
      },
    });

    switch (asset.type) {
      case AssetType.IMAGE: {
        const meta = await this.image.analyze(buffer);
        await this.prisma.evidence.create({
          data: {
            productId: product.id,
            sourceAssetId: asset.id,
            snippet: JSON.stringify(meta),
            explanation: 'Image analysis: dimensions and dominant colors.',
            confidence: 0.75,
          },
        });
        break;
      }
      case AssetType.PDF: {
        const text = await this.pdf.extractText(buffer);
        await this.prisma.evidence.create({
          data: {
            productId: product.id,
            sourceAssetId: asset.id,
            snippet: text.text.slice(0, 500),
            explanation: `PDF text extraction, ${text.pageCount} pages.`,
            confidence: 0.82,
          },
        });
        break;
      }
      case AssetType.CSV:
      case AssetType.XLSX:
      case AssetType.SPREADSHEET: {
        const sheet = this.csv.parseBuffer(buffer, asset.mimeType ?? '');
        await this.prisma.evidence.create({
          data: {
            productId: product.id,
            sourceAssetId: asset.id,
            snippet: JSON.stringify(sheet.sheetNames),
            explanation: 'Structured spreadsheet parsed.',
            confidence: 0.88,
          },
        });
        break;
      }
      default:
        await this.prisma.evidence.create({
          data: {
            productId: product.id,
            sourceAssetId: asset.id,
            snippet: buffer.toString('utf8').slice(0, 400),
            explanation: 'Raw content captured for review.',
            confidence: 0.5,
          },
        });
    }

    await this.prisma.attribute.create({
      data: {
        productId: product.id,
        fieldName: 'ingestion.source',
        value: asset.originalFilename,
        confidence: 0.9,
        method: ExtractionMethod.STRUCTURED_PARSE,
        requiresReview: false,
      },
    });

    const assetsForJob = await this.prisma.sourceAsset.findMany({
      where: { ingestionJobId },
      select: { id: true },
    });
    const evidenceCount = await this.prisma.evidence.count({
      where: { sourceAssetId: { in: assetsForJob.map((a) => a.id) } },
    });
    if (assetsForJob.length > 0 && evidenceCount >= assetsForJob.length) {
      await this.prisma.ingestionJob.update({
        where: { id: ingestionJobId },
        data: { status: IngestionStatus.COMPLETE },
      });
    }
  }
}
