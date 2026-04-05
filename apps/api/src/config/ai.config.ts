import { registerAs } from '@nestjs/config';

export interface AiConfig {
  anthropicApiKey: string;
  model: string;
  maxRetries: number;
  maxTokens: number;
}

export default registerAs(
  'ai',
  (): AiConfig => ({
    anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? '',
    model: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-20250514',
    maxRetries: Number.parseInt(process.env.ANTHROPIC_MAX_RETRIES ?? '3', 10),
    maxTokens: Number.parseInt(process.env.ANTHROPIC_MAX_TOKENS ?? '4096', 10),
  }),
);
