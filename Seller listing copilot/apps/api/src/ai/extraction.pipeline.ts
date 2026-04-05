import { Injectable } from '@nestjs/common';
import { AssetType, ExtractionMethod } from '@prisma/client';
import { PrismaService } from '@/config/database.config';
import { StorageService } from '@/storage/storage.service';
import { CsvProcessor } from '@/ingestion/processors/csv.processor';
import { ImageProcessor } from '@/ingestion/processors/image.processor';
import { PdfProcessor } from '@/ingestion/processors/pdf.processor';
import { UrlProcessor } from '@/ingestion/processors/url.processor';
import { computeConfidence } from '@/products/confidence.scorer';
import { LlmService } from './llm.service';
import { OcrService } from './ocr.service';
import { VisionService } from './vision.service';
import { EXTRACT_ATTRIBUTES_SYSTEM, buildExtractAttributesUserPrompt } from './prompts/extract-attributes.prompt';

const STRUCTURED: ExtractionMethod = ExtractionMethod.STRUCTURED_PARSE;

export interface PipelineInput {
  organizationId: string;
  productId: string;
  sourceAssetId: string;
  assetType: AssetType;
  storageKey: string;
  mimeType: string | null;
}

@Injectable()
export class ExtractionPipeline {
  private readonly SYSTEM_GUARDRAILS = `Never generate weight, dimensions, voltage, wattage, material composition percentage, country of origin, certifications (CE, FCC, UL, Prop65), or compatibility claims unless they appear verbatim or are mathematically derivable from the provided source evidence. For any claim that could affect buyer safety or regulatory compliance, confidence must be SELLER_CONFIRMED or API_LOOKUP.`;

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly image: ImageProcessor,
    private readonly csv: CsvProcessor,
    private readonly pdf: PdfProcessor,
    private readonly url: UrlProcessor,
    private readonly ocr: OcrService,
    private readonly vision: VisionService,
    private readonly llm: LlmService,
  ) {}

  async run(input: PipelineInput): Promise<void> {
    const method = this.routeAsset(input.assetType);
    const buffer = await this.storage.getObjectBuffer(input.storageKey);

    const raw = await this.parallelRawExtraction(input, method, buffer);

    const candidates = this.collectCandidates(raw);

    const ranked = this.rankConflicts(candidates);

    for (const c of ranked) {
      const scored = computeConfidence({
        modelConfidence: c.modelConfidence,
        method: c.method,
        crossSourceAgreement: c.crossSourceAgreement,
        schemaCompatibility: c.schemaCompatibility,
        sellerHistoryMatch: c.sellerHistoryMatch,
      });

      await this.prisma.attribute.create({
        data: {
          productId: input.productId,
          fieldName: c.fieldName,
          value: c.value,
          confidence: scored.confidence,
          method: c.method,
          requiresReview: scored.requiresReview,
          conflicted: c.conflicted,
        },
      });

      await this.prisma.evidence.create({
        data: {
          productId: input.productId,
          sourceAssetId: input.sourceAssetId,
          explanation: `Extracted via ${c.method} with pipeline scoring.`,
          snippet: c.snippet ?? null,
          confidence: scored.confidence,
        },
      });
    }
  }

  private routeAsset(type: AssetType): 'ocr' | 'vision' | 'parse' | 'scrape' {
    switch (type) {
      case AssetType.IMAGE:
        return 'vision';
      case AssetType.PDF:
        return 'ocr';
      case AssetType.CSV:
      case AssetType.XLSX:
      case AssetType.SPREADSHEET:
        return 'parse';
      case AssetType.URL:
        return 'scrape';
      default:
        return 'parse';
    }
  }

  private async parallelRawExtraction(
    input: PipelineInput,
    route: 'ocr' | 'vision' | 'parse' | 'scrape',
    buffer: Buffer,
  ): Promise<RawExtraction[]> {
    const tasks: Promise<RawExtraction>[] = [];

    if (route === 'vision' || input.assetType === AssetType.IMAGE) {
      tasks.push(
        this.image.analyze(buffer).then((meta) => ({
          kind: 'image_meta' as const,
          text: JSON.stringify(meta),
        })),
      );
      tasks.push(
        this.vision
          .extractProductAttributes({
            organizationId: input.organizationId,
            imageBase64: buffer.toString('base64'),
            mediaType: 'image/jpeg',
          })
          .then((j) => ({ kind: 'vision_json' as const, text: JSON.stringify(j) })),
      );
    }

    if (route === 'ocr' || input.mimeType === 'application/pdf') {
      tasks.push(
        this.pdf.extractText(buffer).then((p) => ({
          kind: 'pdf_text' as const,
          text: p.text,
        })),
      );
      tasks.push(
        this.ocr.extractText(buffer).then((o) => ({
          kind: 'ocr_text' as const,
          text: o.text,
        })),
      );
    }

    if (route === 'parse') {
      tasks.push(
        Promise.resolve({
          kind: 'sheet' as const,
          text: JSON.stringify(this.csv.parseBuffer(buffer, input.mimeType ?? '')),
        }),
      );
    }

    if (route === 'scrape') {
      const url = buffer.toString('utf8');
      tasks.push(
        this.url.scrape(url).then((u) => ({
          kind: 'url' as const,
          text: JSON.stringify(u),
        })),
      );
    }

    const settled = await Promise.allSettled(tasks);
    const out: RawExtraction[] = [];
    for (const s of settled) {
      if (s.status === 'fulfilled') {
        out.push(s.value);
      }
    }

    if (out.length === 0 && input.assetType !== AssetType.URL) {
      const user = buildExtractAttributesUserPrompt({
        fieldHints: ['title', 'brand', 'description'],
        sourceText: buffer.toString('utf8').slice(0, 12000),
      });
      const json = await this.llm.completeJson({
        organizationId: input.organizationId,
        system: `${EXTRACT_ATTRIBUTES_SYSTEM}\n\n${this.SYSTEM_GUARDRAILS}`,
        user,
      });
      out.push({ kind: 'llm', text: JSON.stringify(json) });
    }

    return out;
  }

  private collectCandidates(raw: RawExtraction[]): CandidateValue[] {
    const candidates: CandidateValue[] = [];
    for (const r of raw) {
      candidates.push({
        fieldName: 'raw_blob',
        value: r.text.slice(0, 4000),
        modelConfidence: 0.7,
        method: STRUCTURED,
        snippet: r.text.slice(0, 200),
        crossSourceAgreement: 0.8,
        schemaCompatibility: 0.85,
        sellerHistoryMatch: 0.7,
        conflicted: false,
      });
    }
    return candidates;
  }

  private rankConflicts(candidates: CandidateValue[]): CandidateValue[] {
    return [...candidates].sort((a, b) => b.modelConfidence - a.modelConfidence);
  }
}

interface RawExtraction {
  kind: string;
  text: string;
}

interface CandidateValue {
  fieldName: string;
  value: string;
  modelConfidence: number;
  method: ExtractionMethod;
  snippet?: string;
  crossSourceAgreement: number;
  schemaCompatibility: number;
  sellerHistoryMatch: number;
  conflicted: boolean;
}
