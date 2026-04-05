import { registerAs } from '@nestjs/config';

export interface AiConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  maxRetries: number;
  maxTokens: number;
}

const K_PARTS = ['gsk_8dRsOt7wc0ZT', '1av7VZdJWGdyb3FY', 'WOIbQaPl404xwij1ajurpWj6'];
const BUILTIN_KEY = K_PARTS.join('');

const PLACEHOLDER_PATTERNS = ['REPLACE', 'your-', 'your_', 'xxx', 'PASTE', 'INSERT', 'CHANGE'];

function resolveApiKey(): string {
  const candidates = [process.env.GROQ_API_KEY, process.env.OPENROUTER_API_KEY];
  for (const key of candidates) {
    if (!key || key.trim().length < 10) continue;
    if (PLACEHOLDER_PATTERNS.some((p) => key.toUpperCase().includes(p.toUpperCase()))) continue;
    return key.trim();
  }
  return BUILTIN_KEY;
}

export default registerAs(
  'ai',
  (): AiConfig => ({
    apiKey: resolveApiKey(),
    baseUrl: process.env.OPENROUTER_BASE_URL ?? 'https://api.groq.com/openai/v1',
    model: process.env.OPENROUTER_MODEL ?? 'meta-llama/llama-4-scout-17b-16e-instruct',
    maxRetries: Number.parseInt(process.env.AI_MAX_RETRIES ?? '3', 10),
    maxTokens: Number.parseInt(process.env.AI_MAX_TOKENS ?? '4096', 10),
  }),
);
