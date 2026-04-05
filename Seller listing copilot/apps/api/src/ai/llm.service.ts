import OpenAI from 'openai';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/config/database.config';
import { AiConfig } from '@/config/ai.config';

const SYSTEM_GUARDRAILS = `Never generate weight, dimensions, voltage, wattage, or compatibility claims unless they appear verbatim in the provided source evidence. If you cannot find a value in the evidence, return null with a low confidence score.`;

@Injectable()
export class LlmService {
  private client: OpenAI | null = null;
  private readonly logger = new Logger(LlmService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const ai = this.config.get<AiConfig>('ai');
    if (!ai?.apiKey) {
      this.logger.error('⚠ AI API key is NOT configured — set GROQ_API_KEY in apps/api/.env (get a free key at https://console.groq.com/keys)');
    } else {
      const keySource =
        process.env.GROQ_API_KEY && ai.apiKey === process.env.GROQ_API_KEY.trim()
          ? 'GROQ_API_KEY env'
          : process.env.OPENROUTER_API_KEY && ai.apiKey === process.env.OPENROUTER_API_KEY.trim()
            ? 'OPENROUTER_API_KEY env'
            : 'built-in fallback';
      this.logger.log(`AI configured: model=${ai.model}, baseUrl=${ai.baseUrl}, key=${ai.apiKey.slice(0, 8)}… (source: ${keySource})`);
    }
  }

  private getAi(): AiConfig {
    const ai = this.config.get<AiConfig>('ai');
    if (!ai) {
      throw new InternalServerErrorException('AI config missing');
    }
    return ai;
  }

  private ensureClient(): OpenAI {
    const ai = this.getAi();
    if (!ai.apiKey) {
      throw new ServiceUnavailableException('AI API key not configured');
    }
    if (!this.client) {
      this.client = new OpenAI({
        apiKey: ai.apiKey,
        baseURL: ai.baseUrl,
      });
    }
    return this.client;
  }

  async completeJson(params: {
    organizationId: string;
    system: string;
    user: string;
    maxTokens?: number;
  }): Promise<Record<string, unknown>> {
    const ai = this.getAi();
    const maxRetries = ai.maxRetries;
    const client = this.ensureClient();

    let lastErr: unknown;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        this.logger.log(`completeJson attempt ${attempt + 1}/${maxRetries} model=${ai.model}`);
        const res = await client.chat.completions.create({
          model: ai.model,
          max_completion_tokens: params.maxTokens ?? ai.maxTokens,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: `${params.system}\n\n${SYSTEM_GUARDRAILS}` },
            { role: 'user', content: params.user },
          ],
        });
        const text = res.choices?.[0]?.message?.content ?? '';
        this.logger.log(`completeJson response: ${text.length} chars, finish=${res.choices?.[0]?.finish_reason}`);
        const usage = res.usage;
        if (usage) {
          await this.trackUsage(
            params.organizationId,
            usage.prompt_tokens ?? 0,
            usage.completion_tokens ?? 0,
          );
        }
        return this.parseJsonBlock(text);
      } catch (e: unknown) {
        lastErr = e;
        this.logger.error(`completeJson attempt ${attempt + 1} FAILED: ${this.formatError(e)}`);
        if (this.isRateLimit(e) && attempt < maxRetries - 1) {
          await this.delay(2 ** attempt * 500);
          continue;
        }
        if (attempt < maxRetries - 1) {
          await this.delay(2 ** attempt * 300);
          continue;
        }
      }
    }
    throw new ServiceUnavailableException(
      lastErr instanceof Error ? lastErr.message : 'AI request failed',
    );
  }

  async visionJson(params: {
    organizationId: string;
    system: string;
    user: string;
    imageBase64: string;
    mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
  }): Promise<Record<string, unknown>> {
    const ai = this.getAi();
    const client = this.ensureClient();
    const maxRetries = ai.maxRetries;

    const b64Size = (Buffer.byteLength(params.imageBase64, 'utf8') / 1024 / 1024).toFixed(2);
    this.logger.log(`visionJson: image=${b64Size}MB base64, model=${ai.model}, key=${ai.apiKey.slice(0, 8)}…`);

    let lastErr: unknown;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        this.logger.log(`visionJson attempt ${attempt + 1}/${maxRetries}`);
        const dataUrl = `data:${params.mediaType};base64,${params.imageBase64}`;
        const res = await client.chat.completions.create({
          model: ai.model,
          max_completion_tokens: ai.maxTokens,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: `${params.system}\n\n${SYSTEM_GUARDRAILS}` },
            {
              role: 'user',
              content: [
                {
                  type: 'image_url',
                  image_url: { url: dataUrl },
                },
                { type: 'text', text: params.user },
              ],
            },
          ],
        });
        const text = res.choices?.[0]?.message?.content ?? '';
        this.logger.log(`visionJson response: ${text.length} chars, finish=${res.choices?.[0]?.finish_reason}`);
        if (text.length < 5) {
          this.logger.error(`visionJson: suspiciously short response: "${text}"`);
        }
        const usage = res.usage;
        if (usage) {
          this.logger.log(`visionJson usage: prompt=${usage.prompt_tokens}, completion=${usage.completion_tokens}`);
          await this.trackUsage(
            params.organizationId,
            usage.prompt_tokens ?? 0,
            usage.completion_tokens ?? 0,
          );
        }
        return this.parseJsonBlock(text);
      } catch (e: unknown) {
        lastErr = e;
        this.logger.error(`visionJson attempt ${attempt + 1} FAILED: ${this.formatError(e)}`);
        if (this.isRateLimit(e) && attempt < maxRetries - 1) {
          await this.delay(2 ** attempt * 500);
          continue;
        }
        if (attempt < maxRetries - 1) {
          await this.delay(2 ** attempt * 300);
          continue;
        }
      }
    }
    throw new ServiceUnavailableException(
      lastErr instanceof Error ? lastErr.message : 'Vision AI request failed',
    );
  }

  async completeText(params: {
    organizationId: string;
    system: string;
    user: string;
    maxTokens?: number;
  }): Promise<string> {
    const ai = this.getAi();
    const client = this.ensureClient();
    const maxRetries = ai.maxRetries;

    let lastErr: unknown;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        this.logger.log(`completeText attempt ${attempt + 1}/${maxRetries} model=${ai.model}`);
        const res = await client.chat.completions.create({
          model: ai.model,
          max_completion_tokens: params.maxTokens ?? ai.maxTokens,
          messages: [
            { role: 'system', content: params.system },
            { role: 'user', content: params.user },
          ],
        });
        const text = res.choices?.[0]?.message?.content ?? '';
        this.logger.log(`completeText response: ${text.length} chars`);
        const usage = res.usage;
        if (usage) {
          await this.trackUsage(
            params.organizationId,
            usage.prompt_tokens ?? 0,
            usage.completion_tokens ?? 0,
          );
        }
        return text.trim();
      } catch (e: unknown) {
        lastErr = e;
        this.logger.error(`completeText attempt ${attempt + 1} FAILED: ${this.formatError(e)}`);
        if (this.isRateLimit(e) && attempt < maxRetries - 1) {
          await this.delay(2 ** attempt * 500);
          continue;
        }
        if (attempt < maxRetries - 1) {
          await this.delay(2 ** attempt * 300);
          continue;
        }
      }
    }
    throw new ServiceUnavailableException(
      lastErr instanceof Error ? lastErr.message : 'AI text request failed',
    );
  }

  private parseJsonBlock(text: string): Record<string, unknown> {
    const trimmed = text.trim();
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) {
      this.logger.error(`Model did not return JSON. Raw response: ${trimmed.slice(0, 500)}`);
      throw new InternalServerErrorException('Model did not return JSON');
    }
    const slice = trimmed.slice(start, end + 1);
    try {
      return JSON.parse(slice) as Record<string, unknown>;
    } catch (e) {
      this.logger.error(`Failed to parse model JSON: ${e instanceof Error ? e.message : String(e)}. Raw: ${slice.slice(0, 300)}`);
      throw new InternalServerErrorException('Model returned malformed JSON');
    }
  }

  private async trackUsage(
    organizationId: string,
    inputTokens: number,
    outputTokens: number,
  ): Promise<void> {
    const total = inputTokens + outputTokens;
    if (total > 0) {
      await this.prisma.organization.update({
        where: { id: organizationId },
        data: { monthlyTokenUsage: { increment: total } },
      });
    }
  }

  private formatError(err: unknown): string {
    if (err && typeof err === 'object') {
      const e = err as Record<string, unknown>;
      const status = 'status' in e ? e.status : undefined;
      const code = 'code' in e ? e.code : undefined;
      const msg = err instanceof Error ? err.message : JSON.stringify(e).slice(0, 300);
      return `[status=${status ?? '?'} code=${code ?? '?'}] ${msg}`;
    }
    return String(err);
  }

  private isRateLimit(err: unknown): boolean {
    if (err && typeof err === 'object' && 'status' in err) {
      return (err as { status?: number }).status === 429;
    }
    return false;
  }

  private async delay(ms: number): Promise<void> {
    await new Promise((r) => setTimeout(r, ms));
  }
}
