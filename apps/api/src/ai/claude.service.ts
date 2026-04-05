import Anthropic from '@anthropic-ai/sdk';
import {
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/config/database.config';
import { AiConfig } from '@/config/ai.config';

const SYSTEM_GUARDRAILS = `Never generate weight, dimensions, voltage, wattage, or compatibility claims unless they appear verbatim in the provided source evidence. If you cannot find a value in the evidence, return null with a low confidence score.`;

@Injectable()
export class ClaudeService {
  private client: Anthropic | null = null;

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

  private ensureClient(): Anthropic {
    const ai = this.getAi();
    if (!ai.anthropicApiKey) {
      throw new ServiceUnavailableException('Anthropic API key not configured');
    }
    if (!this.client) {
      this.client = new Anthropic({ apiKey: ai.anthropicApiKey });
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
    const model = ai.model;
    const maxRetries = ai.maxRetries;
    const client = this.ensureClient();

    let lastErr: unknown;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const res = await client.messages.create({
          model,
          max_tokens: params.maxTokens ?? ai.maxTokens,
          system: `${params.system}\n\n${SYSTEM_GUARDRAILS}`,
          messages: [{ role: 'user', content: params.user }],
        });
        const text = this.extractText(res);
        const usage = res.usage;
        await this.trackUsage(params.organizationId, usage.input_tokens, usage.output_tokens);
        const json = this.parseJsonBlock(text);
        return json;
      } catch (e: unknown) {
        lastErr = e;
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
      lastErr instanceof Error ? lastErr.message : 'Anthropic request failed',
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
    const res = await client.messages.create({
      model: ai.model,
      max_tokens: ai.maxTokens,
      system: `${params.system}\n\n${SYSTEM_GUARDRAILS}`,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: params.mediaType,
                data: params.imageBase64,
              },
            },
            { type: 'text', text: params.user },
          ],
        },
      ],
    });
    const text = this.extractText(res);
    await this.trackUsage(
      params.organizationId,
      res.usage.input_tokens,
      res.usage.output_tokens,
    );
    return this.parseJsonBlock(text);
  }

  private extractText(
    res: { content: Array<{ type: string; text?: string }> },
  ): string {
    const block = res.content.find((b) => b.type === 'text');
    return block?.text ?? '';
  }

  private parseJsonBlock(text: string): Record<string, unknown> {
    const trimmed = text.trim();
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) {
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
    await this.prisma.organization.update({
      where: { id: organizationId },
      data: { monthlyTokenUsage: { increment: total } },
    });
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
