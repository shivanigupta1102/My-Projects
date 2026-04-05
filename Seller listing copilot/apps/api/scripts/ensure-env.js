#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const apiDir = path.resolve(__dirname, '..');
const envFile = path.join(apiDir, '.env');
const exampleFile = path.join(apiDir, '..', '..', '.env.example');

if (fs.existsSync(envFile)) {
  process.exit(0);
}

if (fs.existsSync(exampleFile)) {
  fs.copyFileSync(exampleFile, envFile);
  console.log('✔ Created apps/api/.env from .env.example (zero-config defaults)');
} else {
  const fallback = [
    'DATABASE_URL=postgresql://postgres:password@localhost:5432/listingpilot',
    'REDIS_HOST=127.0.0.1',
    'REDIS_PORT=6379',
    'PORT=4000',
    'S3_ENDPOINT=http://localhost:9000',
    'S3_BUCKET=listingpilot-assets',
    'S3_ACCESS_KEY_ID=minioadmin',
    'S3_SECRET_ACCESS_KEY=minioadmin',
    'S3_FORCE_PATH_STYLE=true',
    'JWT_ACCESS_SECRET=dev-access-secret',
    'JWT_REFRESH_SECRET=dev-refresh-secret',
    'OPENROUTER_BASE_URL=https://api.groq.com/openai/v1',
    'OPENROUTER_MODEL=meta-llama/llama-4-scout-17b-16e-instruct',
  ].join('\n') + '\n';
  fs.writeFileSync(envFile, fallback);
  console.log('✔ Created apps/api/.env with dev defaults');
}
