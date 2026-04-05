export interface ImageAssetData {
  id: string;
  storageKey: string;
  processedKey?: string;
  thumbnailKey?: string;
  hasWhiteBackground: boolean;
  resolution: string;
  qualityScore: number;
  complianceFlags: Record<string, string[]>;
  dominantColors?: string[];
  detectedObjects?: Array<{ label: string; confidence: number; bbox?: number[] }>;
}
