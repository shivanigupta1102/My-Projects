import { getQueueToken } from '@nestjs/bull';
import { CanActivate, ExecutionContext, INestApplication, VersioningType } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import {
  AssetType,
  IngestionStatus,
  ProductStatus,
  ReviewStatus,
} from '@prisma/client';
import * as request from 'supertest';
import storageConfig from '@/config/storage.config';
import { PrismaService } from '@/config/database.config';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { IngestionController } from '@/ingestion/ingestion.controller';
import { IngestionService } from '@/ingestion/ingestion.service';
import { CsvProcessor } from '@/ingestion/processors/csv.processor';
import { ImageProcessor } from '@/ingestion/processors/image.processor';
import { PdfProcessor } from '@/ingestion/processors/pdf.processor';
import { UrlProcessor } from '@/ingestion/processors/url.processor';
import { IngestAssetProcessor } from '@/queue/jobs/ingest-asset.job';
import type { IngestAssetJobPayload } from '@/queue/jobs/ingest-asset.job';
import { StorageService } from '@/storage/storage.service';
import type { Job } from 'bull';

const ORG_ID = 'org-ingest-test';

class MockJwtGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{ user?: unknown }>();
    req.user = {
      userId: 'user-1',
      email: 't@example.com',
      role: 'OWNER',
      organizationId: ORG_ID,
    };
    return true;
  }
}

interface JobRow {
  id: string;
  status: IngestionStatus;
  organizationId: string;
}

interface AssetRow {
  id: string;
  ingestionJobId: string;
  type: AssetType;
  storageKey: string;
  originalFilename: string;
  mimeType: string;
}

function createIngestionMocks() {
  const buckets = new Map<string, Buffer>();
  const jobs = new Map<string, JobRow>();
  const assets: AssetRow[] = [];
  const products: Array<{
    id: string;
    ingestionJobId: string;
    organizationId: string;
    title: string;
    status: ProductStatus;
    reviewStatus: ReviewStatus;
  }> = [];
  const evidences: Array<{ sourceAssetId: string }> = [];

  const prisma = {
    ingestionJob: {
      create: jest.fn(
        async ({
          data,
        }: {
          data: { organizationId: string; status: IngestionStatus; sourceLabel: string | null };
        }) => {
          const id = `job-${jobs.size + 1}`;
          jobs.set(id, {
            id,
            status: data.status,
            organizationId: data.organizationId,
          });
          return {
            id,
            organizationId: data.organizationId,
            status: data.status,
            sourceLabel: data.sourceLabel,
          };
        },
      ),
      updateMany: jest.fn(
        async ({
          where,
          data,
        }: {
          where: { id: string; status: IngestionStatus };
          data: { status: IngestionStatus };
        }) => {
          const row = jobs.get(where.id);
          if (row && row.status === where.status) {
            row.status = data.status;
            return { count: 1 };
          }
          return { count: 0 };
        },
      ),
      update: jest.fn(
        async ({
          where,
          data,
        }: {
          where: { id: string };
          data: { status: IngestionStatus };
        }) => {
          const row = jobs.get(where.id);
          if (row) {
            row.status = data.status;
          }
          return { id: where.id, status: data.status };
        },
      ),
      findFirst: jest.fn(
        async ({
          where,
        }: {
          where: { id: string; organizationId: string };
        }) => {
          const row = jobs.get(where.id);
          if (!row || row.organizationId !== where.organizationId) {
            return null;
          }
          return {
            id: where.id,
            organizationId: row.organizationId,
            status: row.status,
            _count: { assets: assets.filter((a) => a.ingestionJobId === where.id).length },
          };
        },
      ),
    },
    sourceAsset: {
      create: jest.fn(
        async ({
          data,
        }: {
          data: {
            ingestionJobId: string;
            type: AssetType;
            originalFilename: string;
            storageKey: string;
            mimeType: string;
            sizeBytes: number;
            checksumSha256: string;
          };
        }) => {
          const id = `asset-${assets.length + 1}`;
          assets.push({
            id,
            ingestionJobId: data.ingestionJobId,
            type: data.type,
            storageKey: data.storageKey,
            originalFilename: data.originalFilename,
            mimeType: data.mimeType,
          });
          return { id, ...data };
        },
      ),
      findFirst: jest.fn(
        async ({
          where,
        }: {
          where: { id: string; ingestionJobId: string };
        }) => {
          return (
            assets.find((a) => a.id === where.id && a.ingestionJobId === where.ingestionJobId) ??
            null
          );
        },
      ),
      findMany: jest.fn(
        async ({ where }: { where: { ingestionJobId: string } }) => {
          return assets.filter((a) => a.ingestionJobId === where.ingestionJobId);
        },
      ),
      update: jest.fn(
        async ({
          where,
          data,
        }: {
          where: { id: string };
          data: { checksumSha256?: string; metadataJson?: Record<string, unknown> };
        }) => {
          const a = assets.find((x) => x.id === where.id);
          if (a && data.checksumSha256) {
            return { ...a, checksumSha256: data.checksumSha256 };
          }
          return a;
        },
      ),
    },
    product: {
      findFirst: jest.fn(
        async ({ where }: { where: { ingestionJobId: string } }) => {
          return products.find((p) => p.ingestionJobId === where.ingestionJobId) ?? null;
        },
      ),
      create: jest.fn(
        async ({
          data,
        }: {
          data: {
            organizationId: string;
            ingestionJobId: string;
            title: string;
            status: ProductStatus;
            reviewStatus: ReviewStatus;
          };
        }) => {
          const id = `prod-${products.length + 1}`;
          products.push({ id, ...data });
          return { id, ...data };
        },
      ),
    },
    evidence: {
      create: jest.fn(
        async ({
          data,
        }: {
          data: { sourceAssetId: string };
        }) => {
          evidences.push({ sourceAssetId: data.sourceAssetId });
          return { id: `ev-${evidences.length}` };
        },
      ),
      count: jest.fn(
        async ({
          where,
        }: {
          where: { sourceAssetId: { in: string[] } };
        }) => {
          const set = new Set(where.sourceAssetId.in);
          return evidences.filter((e) => set.has(e.sourceAssetId)).length;
        },
      ),
    },
    attribute: {
      create: jest.fn(async () => ({ id: 'attr-1' })),
    },
  };

  const storage = {
    putObject: jest.fn(async (key: string, buffer: Buffer) => {
      buckets.set(key, buffer);
    }),
    getObjectBuffer: jest.fn(async (key: string) => {
      const b = buckets.get(key);
      if (!b) {
        throw new Error(`missing object ${key}`);
      }
      return b;
    }),
  };

  const queue = {
    add: jest.fn().mockResolvedValue(undefined),
  };

  return { prisma, storage, queue, buckets, jobs, assets, products, evidences };
}

describe('Ingestion flow (integration)', () => {
  let app: INestApplication;

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('POST /api/v1/ingestions with CSV creates a job in PENDING status', async () => {
    const { prisma, storage, queue } = createIngestionMocks();

    const moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ load: [storageConfig], isGlobal: true })],
      controllers: [IngestionController],
      providers: [
        IngestionService,
        ImageProcessor,
        CsvProcessor,
        PdfProcessor,
        UrlProcessor,
        { provide: PrismaService, useValue: prisma },
        { provide: StorageService, useValue: storage },
        { provide: getQueueToken('ingest-asset'), useValue: queue },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(MockJwtGuard)
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    await app.init();

    const csv = Buffer.from('sku,title\n1,Test Widget');

    const res = await request(app.getHttpServer())
      .post('/api/v1/ingestions')
      .attach('files', csv, 'products.csv')
      .field('sourceLabel', 'csv-upload');

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe(IngestionStatus.PENDING);
    expect(prisma.ingestionJob.create).toHaveBeenCalled();
    expect(queue.add).toHaveBeenCalled();
    expect(storage.putObject).toHaveBeenCalled();
  });

  it('processor moves PENDING → PROCESSING → COMPLETE and creates product + source assets', async () => {
    const ctx = createIngestionMocks();
    const { prisma, storage, queue } = ctx;

    const moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ load: [storageConfig], isGlobal: true })],
      providers: [
        IngestionService,
        IngestAssetProcessor,
        ImageProcessor,
        CsvProcessor,
        PdfProcessor,
        { provide: PrismaService, useValue: prisma },
        { provide: StorageService, useValue: storage },
        { provide: getQueueToken('ingest-asset'), useValue: queue },
      ],
    }).compile();

    const ingestion = moduleRef.get(IngestionService);
    const processor = moduleRef.get(IngestAssetProcessor);

    const csvBuffer = Buffer.from('a,b\n1,2');
    const job = await ingestion.createJob(ORG_ID, [
      {
        buffer: csvBuffer,
        originalname: 'data.csv',
        mimetype: 'text/csv',
        size: csvBuffer.length,
      },
    ]);

    expect(job.status).toBe(IngestionStatus.PENDING);
    expect(ctx.assets).toHaveLength(1);
    expect(ctx.assets[0]?.type).toBe(AssetType.CSV);

    const payload: IngestAssetJobPayload = {
      organizationId: ORG_ID,
      ingestionJobId: job.id,
      sourceAssetId: ctx.assets[0]!.id,
    };

    await processor.handle({ data: payload } as Job<IngestAssetJobPayload>);

    expect(prisma.ingestionJob.updateMany).toHaveBeenCalled();
    const row = ctx.jobs.get(job.id);
    expect(row?.status).toBe(IngestionStatus.COMPLETE);
    expect(ctx.products).toHaveLength(1);
    expect(ctx.products[0]?.status).toBe(ProductStatus.DRAFT);
    expect(ctx.evidences).toHaveLength(1);
  });
});
