import { Injectable, Logger } from '@nestjs/common';
import { CHANNEL_MANIFESTS, type ComplianceRule } from '@listingpilot/channel-schemas';

export interface ComplianceCheckResult {
  ruleId: string;
  severity: 'BLOCKING' | 'ERROR' | 'WARNING' | 'INFO';
  field: string;
  currentValue?: string;
  violation: string;
  suggestedFix?: string;
  autoFixAvailable: boolean;
  autoFixApplied: boolean;
  externalPolicyUrl?: string;
}

export interface ComplianceReport {
  channel: string;
  gate: 'PASSED' | 'BLOCKED' | 'PENDING';
  blockingCount: number;
  warningCount: number;
  checks: ComplianceCheckResult[];
}

@Injectable()
export class ComplianceEngine {
  private readonly logger = new Logger(ComplianceEngine.name);

  async runComplianceChecks(
    listingData: Record<string, unknown>,
    channel: string,
  ): Promise<ComplianceReport> {
    const manifest = CHANNEL_MANIFESTS[channel];
    if (!manifest) {
      return { channel, gate: 'PASSED', blockingCount: 0, warningCount: 0, checks: [] };
    }

    const checks: ComplianceCheckResult[] = [];

    for (const rule of manifest.complianceRules) {
      const result = this.evaluateRule(rule, listingData);
      if (result) {
        checks.push(result);
      }
    }

    const blockingCount = checks.filter(c => c.severity === 'BLOCKING').length;
    const warningCount = checks.filter(c => c.severity === 'WARNING').length;

    return {
      channel,
      gate: blockingCount > 0 ? 'BLOCKED' : 'PASSED',
      blockingCount,
      warningCount,
      checks,
    };
  }

  private evaluateRule(
    rule: ComplianceRule,
    data: Record<string, unknown>,
  ): ComplianceCheckResult | null {
    switch (rule.ruleId) {
      case 'AMAZON_GTIN_REQUIRED':
      case 'WALMART_GTIN_REQUIRED':
        if (!data['gtin']) {
          return {
            ruleId: rule.ruleId,
            severity: rule.severity,
            field: rule.field,
            currentValue: undefined,
            violation: rule.description,
            suggestedFix: 'Enter or confirm a valid UPC/EAN for this product',
            autoFixAvailable: rule.autoFixAvailable,
            autoFixApplied: false,
            externalPolicyUrl: rule.policyUrl,
          };
        }
        return null;

      case 'AMAZON_TITLE_BYTE_LIMIT': {
        const title = String(data['title'] ?? '');
        const byteLength = Buffer.byteLength(title, 'utf8');
        if (byteLength > 200) {
          return {
            ruleId: rule.ruleId,
            severity: rule.severity,
            field: 'title',
            currentValue: `${byteLength} bytes`,
            violation: `Title is ${byteLength} bytes, exceeding 200 byte limit`,
            suggestedFix: 'Shorten title to fit within 200 UTF-8 bytes',
            autoFixAvailable: true,
            autoFixApplied: false,
          };
        }
        return null;
      }

      case 'ETSY_TAG_COUNT_EXACT': {
        const tags = Array.isArray(data['tags']) ? data['tags'] : [];
        if (tags.length !== 13) {
          return {
            ruleId: rule.ruleId,
            severity: rule.severity,
            field: 'tags',
            currentValue: `${tags.length} tags`,
            violation: `Etsy requires exactly 13 tags, found ${tags.length}`,
            suggestedFix: tags.length < 13 ? 'Generate additional tags' : 'Remove excess tags',
            autoFixAvailable: true,
            autoFixApplied: false,
            externalPolicyUrl: rule.policyUrl,
          };
        }
        return null;
      }

      case 'ETSY_AI_DISCLOSURE_REQUIRED': {
        const hasAiContent = data['hasAiGeneratedContent'] === true;
        const hasDisclosure = String(data['description'] ?? '').includes('AI');
        if (hasAiContent && !hasDisclosure) {
          return {
            ruleId: rule.ruleId,
            severity: rule.severity,
            field: 'description',
            violation: 'AI-generated content detected without required disclosure',
            suggestedFix: 'Append AI disclosure text to description',
            autoFixAvailable: true,
            autoFixApplied: false,
            externalPolicyUrl: rule.policyUrl,
          };
        }
        return null;
      }

      default:
        return null;
    }
  }

  async applyAutoFix(
    check: ComplianceCheckResult,
    data: Record<string, unknown>,
  ): Promise<{ fixed: boolean; updatedData: Record<string, unknown> }> {
    if (!check.autoFixAvailable) {
      return { fixed: false, updatedData: data };
    }

    this.logger.log(`Applying auto-fix for ${check.ruleId}`);
    return { fixed: false, updatedData: data };
  }
}
