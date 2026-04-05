import { InjectQueue } from '@nestjs/bull';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Queue } from 'bull';
import { createHash, randomUUID } from 'crypto';
import { AssetType, IngestionStatus } from '@prisma/client';
import { PrismaService } from '@/config/database.config';
import { StorageService } from '@/storage/storage.service';

export interface UploadedFileMeta {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

@Injectable()
export class IngestionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    @InjectQueue('ingest-asset') private readonly ingestQueue: Queue,
  ) {}

  async createJob(
    organizationId: string,
    files: UploadedFileMeta[],
    sourceLabel?: string,
  ) {
    if (!files.length) {
      throw new BadRequestException('At least one file is required');
    }
    const job = await this.prisma.ingestionJob.create({
      data: {
        organizationId,
        status: IngestionStatus.PENDING,
        sourceLabel: sourceLabel ?? null,
      },
    });

    for (const f of files) {
      const type = this.detectAssetType(f.mimetype, f.originalname);
      const key = `org/${organizationId}/ingestions/${job.id}/${randomUUID()}-${f.originalname}`;
      await this.storage.putObject(key, f.buffer, f.mimetype);
      const checksum = createHash('sha256').update(f.buffer).digest('hex');
      const asset = await this.prisma.sourceAsset.create({
        data: {
          ingestionJobId: job.id,
          type,
          originalFilename: f.originalname,
          storageKey: key,
          mimeType: f.mimetype,
          sizeBytes: f.size,
          checksumSha256: checksum,
        },
      });
      await this.ingestQueue.add(
        'process',
        {
          organizationId,
          ingestionJobId: job.id,
          sourceAssetId: asset.id,
        },
        {
          attempts: 3,
          timeout: 5 * 60 * 1000,
          removeOnComplete: true,
        },
      );
    }

    return job;
  }

  async getById(organizationId: string, id: string) {
    const job = await this.prisma.ingestionJob.findFirst({
      where: { id, organizationId },
      include: {
        _count: { select: { assets: true } },
        products: {
          select: {
            id: true,
            title: true,
            status: true,
            reviewStatus: true,
            completeness: true,
          },
        },
        assets: {
          select: {
            id: true,
            originalFilename: true,
            mimeType: true,
            type: true,
            sizeBytes: true,
          },
        },
      },
    });
    if (!job) throw new NotFoundException('Ingestion not found');
    return job;
  }

  async listAssets(organizationId: string, jobId: string) {
    await this.getById(organizationId, jobId);
    return this.prisma.sourceAsset.findMany({
      where: { ingestionJobId: jobId },
    });
  }

  private detectAssetType(mime: string, filename: string): AssetType {
    const lower = filename.toLowerCase();
    if (mime.startsWith('image/')) return AssetType.IMAGE;
    if (mime === 'application/pdf' || lower.endsWith('.pdf')) return AssetType.PDF;
    if (mime.includes('csv') || lower.endsWith('.csv')) return AssetType.CSV;
    if (
      mime.includes('spreadsheet') ||
      lower.endsWith('.xlsx') ||
      lower.endsWith('.xls')
    ) {
      return AssetType.XLSX;
    }
    return AssetType.UNKNOWN;
  }
}
