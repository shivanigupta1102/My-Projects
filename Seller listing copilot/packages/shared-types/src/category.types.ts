export type CategoryMappingMethod = 'AI_INFERRED' | 'SELLER_CONFIRMED' | 'PRIOR_LISTING';

export interface CategoryMappingData {
  channel: string;
  categoryId: string;
  categoryPath: string;
  confidence: number;
  method: CategoryMappingMethod;
  itemSpecifics?: Record<string, { required: boolean; value?: string }>;
}
