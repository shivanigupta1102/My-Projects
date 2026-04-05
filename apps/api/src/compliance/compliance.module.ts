import { Module } from '@nestjs/common';
import { ComplianceEngine } from './compliance.engine';
import { GtinValidationService } from './gtin-validation.service';
import { EtsyDisclosureService } from './etsy-disclosure.service';
import { PolicyCacheService } from './policy-cache.service';
import { ComplianceController } from './compliance.controller';

@Module({
  controllers: [ComplianceController],
  providers: [
    ComplianceEngine,
    GtinValidationService,
    EtsyDisclosureService,
    PolicyCacheService,
  ],
  exports: [ComplianceEngine, GtinValidationService, PolicyCacheService],
})
export class ComplianceModule {}
