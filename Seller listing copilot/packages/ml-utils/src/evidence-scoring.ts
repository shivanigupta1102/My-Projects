export interface EvidenceSource {
  sourceType: string;
  confidence: number;
  isVerbatimMatch: boolean;
  characterOffset?: number;
  boundingBox?: { x: number; y: number; width: number; height: number };
}

export function scoreEvidenceSpecificity(sources: EvidenceSource[]): number {
  if (sources.length === 0) return 0;

  let maxSpecificity = 0;
  for (const source of sources) {
    let specificity = source.confidence;

    if (source.isVerbatimMatch) {
      specificity = Math.min(specificity + 0.2, 1.0);
    }

    if (source.characterOffset !== undefined || source.boundingBox !== undefined) {
      specificity = Math.min(specificity + 0.1, 1.0);
    }

    maxSpecificity = Math.max(maxSpecificity, specificity);
  }

  return Math.round(maxSpecificity * 1000) / 1000;
}

export function detectConflicts(
  values: Array<{ value: string; confidence: number; source: string }>,
): { conflicted: boolean; winningValue: string; allValues: string[] } {
  const uniqueValues = [...new Set(values.map(v => v.value.toLowerCase().trim()))];
  
  if (uniqueValues.length <= 1) {
    return {
      conflicted: false,
      winningValue: values[0]?.value ?? '',
      allValues: uniqueValues,
    };
  }

  const sorted = [...values].sort((a, b) => b.confidence - a.confidence);
  return {
    conflicted: true,
    winningValue: sorted[0]?.value ?? '',
    allValues: uniqueValues,
  };
}

export function computeCrossSourceAgreement(
  values: Array<{ value: string; sourceType: string }>,
): number {
  if (values.length <= 1) return 0;
  
  const normalized = values.map(v => v.value.toLowerCase().trim());
  const uniqueSources = new Set(values.map(v => v.sourceType));
  const mostCommon = getMostCommonValue(normalized);
  const agreementCount = normalized.filter(v => v === mostCommon).length;
  
  return (agreementCount / values.length) * (uniqueSources.size / values.length);
}

function getMostCommonValue(values: string[]): string {
  const counts = new Map<string, number>();
  for (const v of values) {
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  let maxCount = 0;
  let maxValue = '';
  for (const [value, count] of counts) {
    if (count > maxCount) {
      maxCount = count;
      maxValue = value;
    }
  }
  return maxValue;
}
