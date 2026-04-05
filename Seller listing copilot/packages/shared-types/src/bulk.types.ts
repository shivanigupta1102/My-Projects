export type BulkOpType = 'PUBLISH' | 'RELIST' | 'PRICE_UPDATE' | 'DELIST' | 'CATEGORY_REMAP';
export type BulkOpStatus = 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface BulkOperationData {
  id: string;
  operationType: BulkOpType;
  status: BulkOpStatus;
  totalItems: number;
  processedItems: number;
  failedItems: number;
  resultSummary?: Record<string, unknown>;
  startedAt?: string;
  completedAt?: string;
}
