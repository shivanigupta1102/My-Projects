import { registerAs } from '@nestjs/config';

export interface StorageConfig {
  region: string;
  bucket: string;
  endpoint?: string;
  forcePathStyle: boolean;
  accessKeyId: string;
  secretAccessKey: string;
  publicBaseUrl?: string;
}

export default registerAs(
  'storage',
  (): StorageConfig => ({
    region: process.env.S3_REGION ?? 'us-east-1',
    bucket: process.env.S3_BUCKET ?? 'listingpilot-local',
    endpoint: process.env.S3_ENDPOINT,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
    accessKeyId: process.env.S3_ACCESS_KEY_ID ?? 'minio',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? 'minio123',
    publicBaseUrl: process.env.S3_PUBLIC_BASE_URL,
  }),
);
