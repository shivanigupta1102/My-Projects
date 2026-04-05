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
    bucket: process.env.S3_BUCKET ?? 'listingpilot-assets',
    endpoint: process.env.S3_ENDPOINT ?? 'http://localhost:9000',
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== 'false',
    accessKeyId: process.env.S3_ACCESS_KEY_ID ?? 'minioadmin',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? 'minioadmin',
    publicBaseUrl: process.env.S3_PUBLIC_BASE_URL,
  }),
);
