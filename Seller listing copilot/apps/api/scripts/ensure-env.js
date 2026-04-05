#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const apiDir = path.resolve(__dirname, '..');
const envFile = path.join(apiDir, '.env');
const exampleFile = path.join(apiDir, '..', '..', '.env.example');

const REQUIRED_KEYS = [
  'DATABASE_URL',
  'REDIS_HOST',
  'S3_ENDPOINT',
  'JWT_ACCESS_SECRET',
];

const DEFAULTS = {
  DATABASE_URL: 'postgresql://postgres:password@localhost:5432/listingpilot',
  REDIS_HOST: '127.0.0.1',
  REDIS_PORT: '6379',
  PORT: '4000',
  S3_ENDPOINT: 'http://localhost:9000',
  S3_BUCKET: 'listingpilot-assets',
  S3_ACCESS_KEY_ID: 'minioadmin',
  S3_SECRET_ACCESS_KEY: 'minioadmin',
  S3_FORCE_PATH_STYLE: 'true',
  JWT_ACCESS_SECRET: 'dev-access-secret',
  JWT_REFRESH_SECRET: 'dev-refresh-secret',
  OPENROUTER_BASE_URL: 'https://api.groq.com/openai/v1',
  OPENROUTER_MODEL: 'meta-llama/llama-4-scout-17b-16e-instruct',
};

if (!fs.existsSync(envFile)) {
  if (fs.existsSync(exampleFile)) {
    fs.copyFileSync(exampleFile, envFile);
    console.log('✔ Created apps/api/.env from .env.example');
  } else {
    const lines = Object.entries(DEFAULTS).map(([k, v]) => `${k}=${v}`);
    fs.writeFileSync(envFile, lines.join('\n') + '\n');
    console.log('✔ Created apps/api/.env with dev defaults');
  }
} else {
  const content = fs.readFileSync(envFile, 'utf8');
  let patched = content;
  let patchCount = 0;

  for (const key of REQUIRED_KEYS) {
    const regex = new RegExp(`^${key}=`, 'm');
    if (!regex.test(content)) {
      patched += `\n${key}=${DEFAULTS[key]}`;
      patchCount++;
    }
  }

  // Remove placeholder GROQ keys that override the built-in fallback
  const placeholderMatch = patched.match(/^GROQ_API_KEY=.*REPLACE.*/mi);
  if (placeholderMatch) {
    patched = patched.replace(/^GROQ_API_KEY=.*REPLACE.*$/mi, '# GROQ_API_KEY= (removed placeholder — built-in key will be used)');
    patchCount++;
  }

  if (patchCount > 0) {
    fs.writeFileSync(envFile, patched);
    console.log(`✔ Patched apps/api/.env: added ${patchCount} missing/fixed entries`);
  }
}
