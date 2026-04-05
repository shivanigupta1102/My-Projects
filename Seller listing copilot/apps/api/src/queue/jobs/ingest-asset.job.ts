import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { createHash } from 'crypto';
import sharp from 'sharp';
import {
  AssetType,
  ExtractionMethod,
  IngestionStatus,
  ProductStatus,
  ReviewStatus,
} from '@prisma/client';
import { Channel } from '@prisma/client';
import { PrismaService } from '@/config/database.config';
import { CsvProcessor } from '@/ingestion/processors/csv.processor';
import { ImageProcessor } from '@/ingestion/processors/image.processor';
import { PdfProcessor } from '@/ingestion/processors/pdf.processor';
import { ListingPackagesService } from '@/listing-packages/listing-packages.service';
import { StorageService } from '@/storage/storage.service';
import { VisionService } from '@/ai/vision.service';

const MAX_VISION_BASE64_BYTES = 3 * 1024 * 1024; // 3MB leaves headroom under Groq's 4MB request limit

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
    private readonly vision: VisionService,
    private readonly listingPackages: ListingPackagesService,
  ) {}

  @Process('process')
  async handle(job: Job<IngestAssetJobPayload>): Promise<void> {
    const { organizationId, ingestionJobId, sourceAssetId } = job.data;
    this.logger.log(`Processing ingestion job=${ingestionJobId} asset=${sourceAssetId}`);

    try {
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

          await this.prisma.ingestionJob.update({
            where: { id: ingestionJobId },
            data: { status: IngestionStatus.EXTRACTING },
          });

          await this.runVisionExtraction(
            organizationId,
            product.id,
            asset.id,
            buffer,
            asset.mimeType ?? 'image/jpeg',
          );
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

      const existingSource = await this.prisma.attribute.findFirst({
        where: { productId: product.id, fieldName: 'ingestion.source', value: asset.originalFilename },
      });
      if (!existingSource) {
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
      }

      await this.markCompleteIfReady(ingestionJobId);
    } catch (err) {
      this.logger.error(`Ingestion failed for job=${ingestionJobId}: ${err instanceof Error ? err.message : String(err)}`);
      await this.prisma.ingestionJob.updateMany({
        where: { id: ingestionJobId },
        data: {
          status: IngestionStatus.FAILED,
          errorMessage: err instanceof Error ? err.message : 'Unknown error',
        },
      });
      throw err;
    }
  }

  private async compressForVision(buffer: Buffer, mimeType: string): Promise<{ base64: string; mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' }> {
    const raw64 = buffer.toString('base64');
    const rawBytes = Buffer.byteLength(raw64, 'utf8');
    const mediaType = this.normalizeMediaType(mimeType);

    if (rawBytes <= MAX_VISION_BASE64_BYTES) {
      this.logger.log(`Image is small enough (${(rawBytes / 1024 / 1024).toFixed(1)}MB base64), no compression needed`);
      return { base64: raw64, mediaType };
    }

    this.logger.log(`Image too large (${(rawBytes / 1024 / 1024).toFixed(1)}MB base64), compressing for Groq vision...`);

    let quality = 80;
    let maxDim = 2048;
    let compressed: Buffer = buffer;

    for (let attempt = 0; attempt < 4; attempt++) {
      compressed = await sharp(buffer)
        .resize(maxDim, maxDim, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality, mozjpeg: true })
        .toBuffer();

      const b64Len = Math.ceil(compressed.length * 4 / 3);
      this.logger.log(`Compression attempt ${attempt + 1}: ${maxDim}px q${quality} → ${(compressed.length / 1024).toFixed(0)}KB (${(b64Len / 1024 / 1024).toFixed(1)}MB base64)`);

      if (b64Len <= MAX_VISION_BASE64_BYTES) break;

      maxDim = Math.round(maxDim * 0.7);
      quality = Math.max(50, quality - 10);
    }

    return { base64: compressed.toString('base64'), mediaType: 'image/jpeg' };
  }

  private async runVisionExtraction(
    organizationId: string,
    productId: string,
    sourceAssetId: string,
    buffer: Buffer,
    mimeType: string,
  ): Promise<void> {
    try {
      this.logger.log(`Running AI vision extraction for product=${productId} (original: ${(buffer.length / 1024).toFixed(0)}KB)`);
      const { base64: imageBase64, mediaType } = await this.compressForVision(buffer, mimeType);
      this.logger.log(`Sending to Groq vision API: ${(Buffer.byteLength(imageBase64, 'utf8') / 1024 / 1024).toFixed(2)}MB base64, mediaType=${mediaType}`);

      const result = await this.vision.extractProductAttributes({
        organizationId,
        imageBase64,
        mediaType,
      });

      this.logger.log(`AI vision returned: ${JSON.stringify(result).slice(0, 300)}`);

      const attrs = (result as Record<string, unknown>) ?? {};
      const fieldEntries = Object.entries(attrs).filter(
        ([, v]) => v != null && v !== '',
      );

      for (const [field, value] of fieldEntries) {
        let strValue: string;
        if (Array.isArray(value)) {
          strValue = value.join(', ');
        } else if (typeof value === 'object') {
          strValue = JSON.stringify(value);
        } else {
          strValue = String(value);
        }
        if (!strValue || strValue === 'null' || strValue === 'undefined') continue;

        const existing = await this.prisma.attribute.findFirst({
          where: { productId, fieldName: field },
        });

        if (existing) {
          if (existing.value !== strValue && strValue.length > existing.value.length) {
            await this.prisma.attribute.update({
              where: { id: existing.id },
              data: { value: strValue, confidence: Math.max(existing.confidence, 0.8) },
            });
          }
        } else {
          await this.prisma.attribute.create({
            data: {
              productId,
              fieldName: field,
              value: strValue,
              confidence: 0.8,
              method: ExtractionMethod.IMAGE_VISION,
              requiresReview: true,
            },
          });
        }
      }

      const productTitle =
        (typeof attrs['title'] === 'string' && attrs['title']) ||
        (typeof attrs['description'] === 'string' && attrs['description']) ||
        (typeof attrs['text_on_product'] === 'string' && attrs['text_on_product']) ||
        (typeof attrs['category'] === 'string' && attrs['category']) ||
        null;
      if (productTitle) {
        await this.prisma.product.update({
          where: { id: productId },
          data: { title: productTitle.slice(0, 200) },
        });
      }

      this.logger.log(
        `✅ AI vision extraction succeeded for product=${productId}: ${fieldEntries.length} attributes stored` +
        (productTitle ? `, title="${productTitle.slice(0, 60)}"` : ', no title found'),
      );

      await this.prisma.evidence.create({
        data: {
          productId,
          sourceAssetId,
          snippet: JSON.stringify(result).slice(0, 500),
          explanation: 'AI vision extraction of product attributes.',
          confidence: 0.8,
        },
      });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `❌ AI vision extraction FAILED for product=${productId}: ${errMsg}. ` +
        `Title and description will be missing. Check that the Groq API key is valid and the network can reach api.groq.com.`,
      );

      await this.prisma.attribute.create({
        data: {
          productId,
          fieldName: 'ingestion.ai_extraction_error',
          value: errMsg.slice(0, 500),
          confidence: 1,
          method: ExtractionMethod.STRUCTURED_PARSE,
          requiresReview: false,
        },
      }).catch(() => { /* best-effort */ });
    }
  }

  private normalizeMediaType(
    mime: string,
  ): 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' {
    if (mime.includes('png')) return 'image/png';
    if (mime.includes('gif')) return 'image/gif';
    if (mime.includes('webp')) return 'image/webp';
    return 'image/jpeg';
  }

  private async markCompleteIfReady(ingestionJobId: string): Promise<void> {
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
        data: { status: IngestionStatus.BUILDING },
      });
      this.logger.log(`Ingestion job=${ingestionJobId} → BUILDING (generating description)`);

      await this.generateHumanDescription(ingestionJobId);

      await this.prisma.ingestionJob.update({
        where: { id: ingestionJobId },
        data: { status: IngestionStatus.COMPLETE },
      });
      this.logger.log(`Ingestion job=${ingestionJobId} marked COMPLETE`);

      await this.autoGenerateListings(ingestionJobId);
    }
  }

  private async generateHumanDescription(ingestionJobId: string): Promise<void> {
    try {
      const product = await this.prisma.product.findFirst({
        where: { ingestionJobId },
        include: { attributes: true },
      });
      if (!product) return;

      const attrMap: Record<string, string> = {};
      for (const attr of product.attributes) {
        if (!attr.fieldName.startsWith('ingestion.') && attr.value) {
          attrMap[attr.fieldName] = attr.value;
        }
      }

      if (Object.keys(attrMap).length === 0) {
        this.logger.warn(`No attributes to build description for product=${product.id}`);
        return;
      }

      this.logger.log(`Generating human description for product=${product.id}`);

      const description = await this.vision.generateHumanDescription({
        organizationId: product.organizationId,
        title: product.title ?? 'Untitled Product',
        attributes: attrMap,
      });

      if (!description) return;

      const existing = await this.prisma.attribute.findFirst({
        where: { productId: product.id, fieldName: 'human_description' },
      });

      if (existing) {
        await this.prisma.attribute.update({
          where: { id: existing.id },
          data: { value: description },
        });
      } else {
        await this.prisma.attribute.create({
          data: {
            productId: product.id,
            fieldName: 'human_description',
            value: description,
            confidence: 0.9,
            method: ExtractionMethod.LLM_INFERENCE,
            requiresReview: true,
          },
        });
      }

      this.logger.log(`Human description generated (${description.length} chars) for product=${product.id}`);
    } catch (err) {
      this.logger.warn(
        `Human description generation failed (non-fatal): ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  private async autoGenerateListings(ingestionJobId: string): Promise<void> {
    try {
      const product = await this.prisma.product.findFirst({
        where: { ingestionJobId },
        select: { id: true, organizationId: true },
      });
      if (!product) return;

      const allChannels: Channel[] = [
        Channel.AMAZON,
        Channel.EBAY,
        Channel.WALMART,
        Channel.SHOPIFY,
        Channel.ETSY,
      ];

      this.logger.log(`Auto-generating channel listings for product=${product.id}`);
      const results = await this.listingPackages.generatePackages(
        product.organizationId,
        product.id,
        allChannels,
      );
      const fulfilled = results.filter(r => r.status === 'fulfilled').length;
      const rejected = results.filter(r => r.status === 'rejected').length;
      this.logger.log(
        `Channel listing generation: ${fulfilled} succeeded, ${rejected} failed`,
      );
    } catch (err) {
      this.logger.warn(
        `Auto-generation of channel listings failed (non-fatal): ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
