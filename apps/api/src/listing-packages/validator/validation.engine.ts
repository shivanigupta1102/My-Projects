import { Channel, Severity } from '@prisma/client';
import { QualityScore, ValidationIssue } from '@listingpilot/shared-types';
import { CanonicalFacts } from '../generators/channel-generator.interface';
import { imageCompletenessRule } from './rules/image-completeness.rule';
import { prohibitedContentRule } from './rules/prohibited-content.rule';
import { requiredFieldsRule } from './rules/required-fields.rule';
import { titleLengthRule } from './rules/title-length.rule';

export function runValidation(
  channel: Channel,
  facts: CanonicalFacts,
): QualityScore {
  const issues: ValidationIssue[] = [
    ...requiredFieldsRule(channel, facts),
    ...titleLengthRule(channel, facts.title),
    ...prohibitedContentRule(
      [facts.title, facts.description, ...facts.bullets].filter(Boolean).join(' '),
    ),
    ...imageCompletenessRule(facts),
  ];

  const hasBlocking = issues.some((i) => i.severity === Severity.BLOCKING);

  const requiredFieldCompleteness = issues.some((i) => i.rule === 'required-fields')
    ? 0.4
    : 1;
  const categoryAccuracy = 0.85;
  const attributeRichness =
    Object.keys(facts.attributes).length >= 5 ? 0.9 : 0.65;
  const imageComplianceScore = facts.images.length > 0 ? 1 : 0.3;
  const titleQuality = facts.title && facts.title.length >= 20 ? 0.9 : 0.55;
  const policyRiskPenalty = Math.min(
    0.3,
    issues.filter((i) => i.severity === Severity.WARNING).length * 0.05,
  );
  const safetyCriticalReview = 1;

  const total =
    requiredFieldCompleteness * 0.3 +
    categoryAccuracy * 0.2 +
    attributeRichness * 0.2 +
    imageComplianceScore * 0.15 +
    titleQuality * 0.1 -
    policyRiskPenalty;

  const readyToPublish = total >= 0.7 && !hasBlocking;

  return {
    total: Math.max(0, Math.min(1, total)),
    breakdown: {
      requiredFieldCompleteness,
      categoryAccuracy,
      imageComplianceScore,
      attributeRichness,
      titleQuality,
      policyRiskPenalty,
      safetyCriticalReview,
    },
    issues,
    readyToPublish,
  };
}
