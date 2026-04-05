import { Injectable, Logger } from '@nestjs/common';
import { validateGtin, type GtinValidationResult } from '@listingpilot/ml-utils';

@Injectable()
export class GtinValidationService {
  private readonly logger = new Logger(GtinValidationService.name);

  async validate(gtin: string): Promise<GtinValidationResult & { brandRegistryStatus?: string }> {
    this.logger.log(`Validating GTIN: ${gtin}`);
    const result = validateGtin(gtin);

    // TODO: Check against Open Product Data (open.fda.gov, barcodelookup)
    // TODO: Check Amazon Brand Registry status via SP-API
    return {
      ...result,
      brandRegistryStatus: 'UNKNOWN',
    };
  }
}
