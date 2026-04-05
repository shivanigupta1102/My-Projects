import { Injectable, Logger } from '@nestjs/common';
import { ClaudeService } from './claude.service';

const VISION_SYSTEM = `You are an expert product listing analyst. Your job is to extract EVERY possible attribute from product images with extreme thoroughness. You must catch details that others would miss.

Return ONLY valid JSON. Extract ALL of the following fields — set null ONLY if truly not visible:

{
  "title": string | null,
  "brand": string | null,
  "manufacturer": string | null,
  "model": string | null,
  "model_number": string | null,
  "category": string | null,
  "subcategory": string | null,
  "condition": string | null,
  "color": string | null,
  "material": string | null,
  "size": string | null,
  "weight": string | null,
  "dimensions": string | null,
  "year": string | null,
  "country_of_origin": string | null,

  "certification_company": string | null,
  "certification_number": string | null,
  "grade": string | null,
  "authentication_details": string | null,

  "player_name": string | null,
  "team": string | null,
  "card_number": string | null,
  "card_set": string | null,
  "card_year": string | null,
  "serial_number": string | null,
  "edition": string | null,
  "variant": string | null,
  "rarity": string | null,
  "autograph": boolean | null,
  "memorabilia_type": string | null,

  "notable_features": string[] | null,
  "certifications": string[] | null,
  "text_on_product": string | null,
  "visible_labels": string[] | null,
  "barcodes_visible": string[] | null,
  "logos_visible": string[] | null,
  "description": string | null
}

CRITICAL RULES:
- READ ALL TEXT visible on the product, labels, stickers, cases, and packaging
- For graded/certified items (PSA, BGS, CGC, SGC, JSA, Beckett, etc.): ALWAYS extract the certification company name AND the certification/serial number printed on the label or case
- For sports cards: extract player, team, year, card number, set name, parallel/variant info
- For collectibles: extract edition, serial numbers, authentication details
- For electronics: extract model numbers, specs, certifications (FCC, CE, UL)
- Look at EVERY label, sticker, tag, stamp, and printed text in the image
- If you see a number on a grading slab/case, that is the certification_number
- If you see "PSA 10" or "BGS 9.5", split into certification_company and grade
- Do NOT fabricate values — only report what you can see`;

const DESCRIPTION_SYSTEM = `You are a professional e-commerce copywriter. Write exactly ONE paragraph — no more, no less.

Rules:
- Write ONE single paragraph (3-5 sentences) that sounds like a real, knowledgeable seller
- Naturally weave in the key attributes: what it is, brand, condition, grade, certification details
- If certification info exists (PSA, BGS, cert number, grade), mention it as it builds buyer trust
- Sound warm and confident, not robotic
- Do NOT use bullet points, markdown, or headers
- Do NOT start with "Introducing" or "This is a"
- Do NOT include pricing, shipping, or return info
- Do NOT make claims that aren't in the provided attributes
- Keep it punchy and compelling — every sentence should add value`;

@Injectable()
export class VisionService {
  private readonly logger = new Logger(VisionService.name);

  constructor(private readonly claude: ClaudeService) {}

  async extractProductAttributes(params: {
    organizationId: string;
    imageBase64: string;
    mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
  }): Promise<Record<string, unknown>> {
    return this.claude.visionJson({
      organizationId: params.organizationId,
      system: VISION_SYSTEM,
      user: `Analyze this product image with extreme attention to detail. Read ALL text visible anywhere in the image — on the product, labels, cases, stickers, packaging, certification slabs, etc.

If this is a graded/certified item, you MUST extract:
1. The certification company (PSA, BGS, CGC, SGC, etc.)
2. The certification/serial number on the label
3. The grade (numeric score)

Extract every single attribute you can identify. Return ONLY the JSON object.`,
      imageBase64: params.imageBase64,
      mediaType: params.mediaType,
    });
  }

  async generateHumanDescription(params: {
    organizationId: string;
    title: string;
    attributes: Record<string, string>;
  }): Promise<string> {
    const { title, attributes } = params;

    const attrLines = Object.entries(attributes)
      .filter(([k]) => !k.startsWith('ingestion.'))
      .map(([k, v]) => `- ${k.replace(/_/g, ' ')}: ${v}`)
      .join('\n');

    const prompt = `Write exactly ONE paragraph (3-5 sentences) for this product listing.

Product Title: ${title}

Extracted Attributes:
${attrLines}

Write the single paragraph now. Remember — ONE paragraph only, sound human and knowledgeable.`;

    this.logger.log(`Generating human description for: ${title}`);

    const text = await this.claude.completeText({
      organizationId: params.organizationId,
      system: DESCRIPTION_SYSTEM,
      user: prompt,
      maxTokens: 512,
    });

    return text;
  }
}
