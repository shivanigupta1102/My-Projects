import 'dotenv/config';
import { Worker, Queue } from 'bullmq';
import IORedis from 'ioredis';

const REDIS_HOST = process.env.REDIS_HOST ?? '127.0.0.1';
const REDIS_PORT = parseInt(process.env.REDIS_PORT ?? '6379', 10);
const CONCURRENCY = parseInt(process.env.WORKER_CONCURRENCY ?? '5', 10);

const connection = new IORedis(REDIS_PORT, REDIS_HOST, {
  maxRetriesPerRequest: null,
});

const worker = new Worker(
  'listingpilot',
  async (job) => {
    console.log(`[Worker] Processing job ${job.name} (${job.id})`);

    switch (job.name) {
      case 'ingest-asset':
        console.log(`  Ingesting asset: ${JSON.stringify(job.data).slice(0, 200)}`);
        break;

      case 'build-canonical':
        console.log(`  Building canonical product: ${job.data.productId}`);
        break;

      case 'generate-packages':
        console.log(`  Generating listing packages: ${job.data.productId}`);
        break;

      case 'run-compliance':
        console.log(`  Running compliance checks: ${job.data.listingPackageId}`);
        break;

      case 'publish-listing':
        console.log(`  Publishing listing: ${job.data.listingPackageId} → ${job.data.channel}`);
        break;

      case 'monitor-listing':
        console.log(`  Monitoring listing: ${job.data.monitorId}`);
        break;

      case 'bulk-operation':
        console.log(`  Bulk operation: ${job.data.operationId} (${job.data.type})`);
        break;

      case 'detect-duplicates':
        console.log(`  Semantic dedup: ${job.data.productId}`);
        break;

      case 'process-image':
        console.log(`  Image processing: ${job.data.imageAssetId}`);
        break;

      case 'map-category':
        console.log(`  Category mapping: ${job.data.productId} → ${job.data.channel}`);
        break;

      default:
        console.warn(`  Unknown job type: ${job.name}`);
    }

    return { success: true, processedAt: new Date().toISOString() };
  },
  {
    connection,
    concurrency: CONCURRENCY,
  },
);

worker.on('completed', (job) => {
  console.log(`[Worker] Job ${job.name} (${job.id}) completed`);
});

worker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.name} (${job?.id}) failed:`, err.message);
});

worker.on('error', (err) => {
  console.error('[Worker] Error:', err.message);
});

const PORT = parseInt(process.env.WORKER_PORT ?? '4001', 10);
console.log(`[Worker] ListingPilot worker started (concurrency: ${CONCURRENCY})`);
console.log(`[Worker] Connected to Redis at ${REDIS_HOST}:${REDIS_PORT}`);
console.log(`[Worker] Listening for jobs on queue "listingpilot"`);
