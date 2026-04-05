import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ComplianceEngine } from './compliance.engine';
import { GtinValidationService } from './gtin-validation.service';
import { PolicyCacheService } from './policy-cache.service';

@ApiTags('Compliance')
@ApiBearerAuth()
@Controller('api/v1')
export class ComplianceController {
  constructor(
    private readonly complianceEngine: ComplianceEngine,
    private readonly gtinService: GtinValidationService,
    private readonly policyCache: PolicyCacheService,
  ) {}

  @Get('products/:id/compliance')
  async getComplianceReport(@Param('id') productId: string) {
    void this.complianceEngine;
    return { productId, channels: [] };
  }

  @Post('products/:id/listing-packages/:channel/auto-fix')
  async applyAutoFixes(
    @Param('id') productId: string,
    @Param('channel') channel: string,
  ) {
    void this.complianceEngine;
    return { productId, channel, fixesApplied: 0 };
  }

  @Post('products/:id/gtin/validate')
  async validateGtin(
    @Param('id') productId: string,
    @Body('gtin') gtin: string,
  ) {
    const result = await this.gtinService.validate(gtin);
    return { productId, ...result };
  }

  @Get('channel-policies/:channel')
  async getChannelPolicies(@Param('channel') channel: string) {
    void this.policyCache;
    return { channel, policies: [] };
  }

  @Post('channel-policies/:channel/refresh')
  async refreshPolicies(@Param('channel') channel: string) {
    void this.policyCache;
    return { channel, refreshed: true };
  }
}
