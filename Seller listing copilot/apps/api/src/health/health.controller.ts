import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '@/auth/guards/jwt-auth.guard';
import { PrismaService } from '@/config/database.config';
import { AiConfig } from '@/config/ai.config';
import { StorageConfig } from '@/config/storage.config';
import { RedisConfig } from '@/config/redis.config';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Full system health check — no auth required' })
  async check() {
    const checks: Record<string, { ok: boolean; detail: string }> = {};

    // 1. Database
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      const productCount = await this.prisma.product.count();
      const attrCount = await this.prisma.attribute.count();
      checks.database = {
        ok: true,
        detail: `Connected. ${productCount} products, ${attrCount} attributes`,
      };
    } catch (e) {
      checks.database = { ok: false, detail: e instanceof Error ? e.message : String(e) };
    }

    // 2. AI config
    const ai = this.config.get<AiConfig>('ai');
    if (ai?.apiKey) {
      const keyPreview = ai.apiKey.slice(0, 12) + '…';
      const isBuiltin = !process.env.GROQ_API_KEY && !process.env.OPENROUTER_API_KEY;
      checks.ai_config = {
        ok: true,
        detail: `key=${keyPreview} model=${ai.model} source=${isBuiltin ? 'built-in' : 'env'}`,
      };
    } else {
      checks.ai_config = { ok: false, detail: 'No API key configured' };
    }

    // 3. Groq API connectivity
    try {
      const res = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { Authorization: `Bearer ${ai?.apiKey ?? ''}` },
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        const data = await res.json() as { data?: { id: string }[] };
        const models = data.data?.map((m) => m.id) ?? [];
        const hasVision = models.includes('meta-llama/llama-4-scout-17b-16e-instruct');
        checks.groq_api = {
          ok: true,
          detail: `Reachable. ${models.length} models, vision model ${hasVision ? 'available' : 'MISSING'}`,
        };
      } else {
        const body = await res.text().catch(() => '');
        checks.groq_api = { ok: false, detail: `HTTP ${res.status}: ${body.slice(0, 200)}` };
      }
    } catch (e) {
      checks.groq_api = { ok: false, detail: e instanceof Error ? e.message : String(e) };
    }

    // 4. Storage (MinIO/S3)
    const storage = this.config.get<StorageConfig>('storage');
    checks.storage_config = {
      ok: !!storage?.endpoint,
      detail: `endpoint=${storage?.endpoint ?? 'NOT SET'} bucket=${storage?.bucket ?? 'NOT SET'} key=${storage?.accessKeyId ?? 'NOT SET'}`,
    };

    // 5. Redis
    const redis = this.config.get<RedisConfig>('redis');
    checks.redis_config = {
      ok: !!redis?.host,
      detail: `host=${redis?.host ?? 'NOT SET'}:${redis?.port ?? 'NOT SET'}`,
    };

    // 6. .env file detection
    const envVars = ['DATABASE_URL', 'REDIS_HOST', 'S3_ENDPOINT', 'GROQ_API_KEY', 'OPENROUTER_API_KEY', 'PORT'];
    const envStatus: Record<string, string> = {};
    for (const v of envVars) {
      envStatus[v] = process.env[v] ? `set (${process.env[v]!.slice(0, 20)}${process.env[v]!.length > 20 ? '…' : ''})` : 'NOT SET';
    }
    checks.env_vars = { ok: !!process.env.DATABASE_URL, detail: JSON.stringify(envStatus) };

    // 7. Recent ingestion jobs
    try {
      const recent = await this.prisma.ingestionJob.findMany({
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: { id: true, status: true, errorMessage: true, createdAt: true },
      });
      const summary = recent.map((j) => `${j.status}${j.errorMessage ? ` (${j.errorMessage.slice(0, 50)})` : ''}`);
      checks.recent_ingestions = { ok: true, detail: summary.length > 0 ? summary.join(' | ') : 'No jobs yet' };
    } catch (e) {
      checks.recent_ingestions = { ok: false, detail: e instanceof Error ? e.message : String(e) };
    }

    // 8. Check if any products have AI-extracted attributes
    try {
      const aiAttrs = await this.prisma.attribute.count({ where: { method: 'IMAGE_VISION' } });
      const errors = await this.prisma.attribute.findMany({
        where: { fieldName: 'ingestion.ai_extraction_error' },
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: { value: true, createdAt: true },
      });
      const errorSummary = errors.map((e) => e.value.slice(0, 80));
      checks.ai_extraction = {
        ok: aiAttrs > 0 || errors.length === 0,
        detail: `${aiAttrs} AI-extracted attributes. ${errors.length > 0 ? `Recent errors: ${errorSummary.join(' | ')}` : 'No errors.'}`,
      };
    } catch (e) {
      checks.ai_extraction = { ok: false, detail: e instanceof Error ? e.message : String(e) };
    }

    const allOk = Object.values(checks).every((c) => c.ok);

    return {
      success: true,
      data: {
        status: allOk ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        checks,
      },
    };
  }
}
