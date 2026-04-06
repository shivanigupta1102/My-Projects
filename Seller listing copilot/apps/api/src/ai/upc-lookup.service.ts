import { Injectable, Logger } from '@nestjs/common';
import { validateGtin, identifyGtinType } from '@listingpilot/ml-utils';

export interface UpcProductInfo {
  upc: string;
  ean: string | null;
  title: string | null;
  brand: string | null;
  description: string | null;
  category: string | null;
  manufacturer: string | null;
  model: string | null;
  color: string | null;
  size: string | null;
  weight: string | null;
  dimensions: string | null;
  imageUrl: string | null;
  lowestPrice: number | null;
  highestPrice: number | null;
  attributes: Record<string, string>;
}

const UPCITEMDB_URL = 'https://api.upcitemdb.com/prod/trial/lookup';

@Injectable()
export class UpcLookupService {
  private readonly logger = new Logger(UpcLookupService.name);

  async lookupUpc(code: string): Promise<UpcProductInfo | null> {
    const cleaned = code.replace(/[^0-9]/g, '');
    if (!cleaned || cleaned.length < 8) {
      this.logger.warn(`Invalid UPC/barcode code: "${code}" (cleaned: "${cleaned}")`);
      return null;
    }

    const validation = validateGtin(cleaned);
    this.logger.log(
      `UPC lookup: code=${cleaned}, type=${validation.gtinType}, valid=${validation.isValid}`,
    );

    const result = await this.lookupViaUpcItemDb(cleaned);
    if (result) return result;

    const goUpcKey = process.env.GO_UPC_API_KEY;
    if (goUpcKey) {
      const goResult = await this.lookupViaGoUpc(cleaned, goUpcKey);
      if (goResult) return goResult;
    }

    this.logger.warn(`No UPC data found for code=${cleaned} from any source`);
    return null;
  }

  extractBarcodesFromVisionResult(attrs: Record<string, unknown>): string[] {
    const codes: string[] = [];

    const barcodesVisible = attrs['barcodes_visible'];
    if (Array.isArray(barcodesVisible)) {
      for (const b of barcodesVisible) {
        const cleaned = String(b).replace(/[^0-9]/g, '');
        if (cleaned.length >= 8 && cleaned.length <= 14) {
          codes.push(cleaned);
        }
      }
    } else if (typeof barcodesVisible === 'string') {
      for (const part of barcodesVisible.split(/[,;\s]+/)) {
        const cleaned = part.replace(/[^0-9]/g, '');
        if (cleaned.length >= 8 && cleaned.length <= 14) {
          codes.push(cleaned);
        }
      }
    }

    const textOnProduct = attrs['text_on_product'];
    if (typeof textOnProduct === 'string') {
      const upcPattern = /\b(\d{12,14})\b/g;
      let match: RegExpExecArray | null;
      while ((match = upcPattern.exec(textOnProduct)) !== null) {
        const candidate = match[1];
        const result = validateGtin(candidate);
        if (result.isValid) {
          codes.push(candidate);
        }
      }
    }

    return [...new Set(codes)];
  }

  private async lookupViaUpcItemDb(code: string): Promise<UpcProductInfo | null> {
    try {
      const url = `${UPCITEMDB_URL}?upc=${code}`;
      this.logger.log(`Calling UPCitemdb API: ${url}`);

      const response = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        this.logger.warn(`UPCitemdb returned ${response.status}: ${body.slice(0, 200)}`);
        return null;
      }

      const data = await response.json() as Record<string, unknown>;

      if (data['code'] !== 'OK') {
        this.logger.warn(`UPCitemdb non-OK code: ${data['code']}`);
        return null;
      }

      const items = data['items'] as Array<Record<string, unknown>> | undefined;
      if (!items || items.length === 0) {
        this.logger.warn(`UPCitemdb returned 0 items for ${code}`);
        return null;
      }

      const item = items[0];
      this.logger.log(`✅ UPCitemdb match: "${item['title']}" by ${item['brand']}`);

      const attrs: Record<string, string> = {};
      if (item['category']) attrs['category'] = String(item['category']);
      if (item['lowest_recorded_price']) attrs['lowest_price'] = String(item['lowest_recorded_price']);
      if (item['highest_recorded_price']) attrs['highest_price'] = String(item['highest_recorded_price']);

      const images = item['images'] as string[] | undefined;

      return {
        upc: String(item['upc'] ?? code),
        ean: String(item['ean'] ?? '') || null,
        title: String(item['title'] ?? '') || null,
        brand: String(item['brand'] ?? '') || null,
        description: String(item['description'] ?? '') || null,
        category: String(item['category'] ?? '') || null,
        manufacturer: null,
        model: String(item['model'] ?? '') || null,
        color: String(item['color'] ?? '') || null,
        size: String(item['size'] ?? '') || null,
        weight: String(item['weight'] ?? '') || null,
        dimensions: String(item['dimension'] ?? '') || null,
        imageUrl: images && images.length > 0 ? images[0] : null,
        lowestPrice: item['lowest_recorded_price'] ? Number(item['lowest_recorded_price']) : null,
        highestPrice: item['highest_recorded_price'] ? Number(item['highest_recorded_price']) : null,
        attributes: attrs,
      };
    } catch (err) {
      this.logger.warn(
        `UPCitemdb lookup failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      return null;
    }
  }

  private async lookupViaGoUpc(code: string, apiKey: string): Promise<UpcProductInfo | null> {
    try {
      const url = `https://go-upc.com/api/v1/code/${code}`;
      this.logger.log(`Calling go-upc.com API: ${url}`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        this.logger.warn(`go-upc.com returned ${response.status}`);
        return null;
      }

      const data = await response.json() as Record<string, unknown>;
      const product = data['product'] as Record<string, unknown> | undefined;
      if (!product) return null;

      const gtinType = identifyGtinType(code);

      return {
        upc: gtinType === 'UPC' ? code : (String(product['upc'] ?? '') || code),
        ean: gtinType === 'EAN' ? code : (String(product['ean'] ?? '') || null),
        title: String(product['name'] ?? '') || null,
        brand: String(product['brand'] ?? '') || null,
        description: String(product['description'] ?? '') || null,
        category: String(product['category'] ?? '') || null,
        manufacturer: String(product['manufacturer'] ?? '') || null,
        model: null,
        color: null,
        size: null,
        weight: null,
        dimensions: null,
        imageUrl: String(product['imageUrl'] ?? '') || null,
        lowestPrice: null,
        highestPrice: null,
        attributes: {},
      };
    } catch (err) {
      this.logger.warn(
        `go-upc.com lookup failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      return null;
    }
  }
}
