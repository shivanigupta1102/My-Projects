export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export interface DashboardSummary {
  totalProducts: number;
  productsNeedingReview: number;
  readyToPublish: number;
  publishedListings: number;
  activeAlerts: number;
  avgCompleteness: number;
  timeSavedHours: number;
  recentPublishEvents: PublishEventSummary[];
}

export interface PublishEventSummary {
  id: string;
  productTitle: string;
  channel: string;
  status: string;
  publishedAt: string | null;
}

export interface ReviewQueueItem {
  attributeId: string;
  productId: string;
  productTitle: string;
  fieldName: string;
  value: string;
  confidence: number;
  method: string;
  conflicted: boolean;
  evidenceCount: number;
}

export interface ConfidenceDistribution {
  high: number;
  medium: number;
  low: number;
  total: number;
}

export interface ComplianceSummary {
  channel: string;
  passRate: number;
  blockingCount: number;
  warningCount: number;
  topViolations: Array<{ ruleId: string; count: number }>;
}

export interface PublishSuccessRate {
  channel: string;
  period: string;
  successCount: number;
  failureCount: number;
  rate: number;
}

export interface ChannelHealthScore {
  channel: string;
  score: number;
  activeListings: number;
  suppressedListings: number;
  trend: 'up' | 'down' | 'stable';
}
