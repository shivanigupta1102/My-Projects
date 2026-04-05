import { registerAs } from '@nestjs/config';

export interface AiConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  maxRetries: number;
  maxTokens: number;
}

export default registerAs(
  'ai',
  (): AiConfig => ({
    apiKey: process.env.OPENROUTER_API_KEY ?? process.env.ANTHROPIC_API_KEY ?? '',
    baseUrl: process.env.OPENROUTER_BASE_URL ?? 'https://openrouter.ai/api/v1',
    model: process.env.OPENROUTER_MODEL ?? 'meta-llama/llama-4-scout-17b-16e-instruct',
    maxRetries: Number.parseInt(process.env.AI_MAX_RETRIES ?? '3', 10),
    maxTokens: Number.parseInt(process.env.AI_MAX_TOKENS ?? '4096', 10),
  }),
);
