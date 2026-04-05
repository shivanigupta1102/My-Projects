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
export class ClaudeService {
  private client: OpenAI | null = null;
  private readonly logger = new Logger(ClaudeService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

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
        defaultHeaders: {
          'HTTP-Referer': 'https://listingpilot.ai',
          'X-Title': 'ListingPilot AI',
        },
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
        const res = await client.chat.completions.create({
          model: ai.model,
          max_tokens: params.maxTokens ?? ai.maxTokens,
          messages: [
            { role: 'system', content: `${params.system}\n\n${SYSTEM_GUARDRAILS}` },
            { role: 'user', content: params.user },
          ],
        });
        const text = res.choices?.[0]?.message?.content ?? '';
        this.logger.debug(`completeJson response length: ${text.length}`);
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
        this.logger.warn(`AI request attempt ${attempt + 1} failed: ${e instanceof Error ? e.message : String(e)}`);
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

    let lastErr: unknown;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const dataUrl = `data:${params.mediaType};base64,${params.imageBase64}`;
        const res = await client.chat.completions.create({
          model: ai.model,
          max_tokens: ai.maxTokens,
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
        this.logger.debug(`visionJson response length: ${text.length}`);
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
        this.logger.warn(`Vision request attempt ${attempt + 1} failed: ${e instanceof Error ? e.message : String(e)}`);
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
        const res = await client.chat.completions.create({
          model: ai.model,
          max_tokens: params.maxTokens ?? ai.maxTokens,
          messages: [
            { role: 'system', content: params.system },
            { role: 'user', content: params.user },
          ],
        });
        const text = res.choices?.[0]?.message?.content ?? '';
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
        this.logger.warn(`Text completion attempt ${attempt + 1} failed: ${e instanceof Error ? e.message : String(e)}`);
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
    return JSON.parse(slice) as Record<string, unknown>;
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
