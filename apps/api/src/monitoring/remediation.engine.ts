import { RemediationType } from '@prisma/client';

/** Midpoints of impact bands (90–100, 70–90, …) for deterministic ordering and display. */
export function rankRemediationImpact(type: RemediationType): number {
  switch (type) {
    case 'SUPPRESSION_FIX':
      return 95;
    case 'MISSING_REQUIRED':
      return 80;
    case 'CATEGORY_MISMATCH':
      return 70;
    case 'CONTENT_DRIFT':
      return 52;
    case 'DISCOVERABILITY':
      return 45;
    case 'CONVERSION':
      return 20;
    default:
      return 20;
  }
}

export interface RemediationRankable {
  id: string;
  type: RemediationType;
  dismissed?: boolean;
}

/** Sorts by impact descending; equal impact preserves input order. Dismissed items are excluded. */
export function rankRemediationItems<T extends RemediationRankable>(items: T[]): T[] {
  if (items.length === 0) {
    return [];
  }
  const active = items.filter((i) => !i.dismissed);
  return active
    .map((item, originalIndex) => ({
      item,
      originalIndex,
      impact: rankRemediationImpact(item.type),
    }))
    .sort((a, b) => {
      if (b.impact !== a.impact) {
        return b.impact - a.impact;
      }
      return a.originalIndex - b.originalIndex;
    })
    .map((row) => row.item);
}
