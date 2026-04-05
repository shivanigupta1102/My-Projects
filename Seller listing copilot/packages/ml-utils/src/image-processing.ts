export interface ImageDimensions {
  width: number;
  height: number;
}

export interface BackgroundAnalysis {
  isPureWhite: boolean;
  dominantColor: string;
  whitePercentage: number;
}

export interface ImageQualityMetrics {
  blurScore: number;
  exposureScore: number;
  framingScore: number;
  overallScore: number;
}

export function calculateAspectRatio(dimensions: ImageDimensions): number {
  if (dimensions.height === 0) return 0;
  return dimensions.width / dimensions.height;
}

export function meetsResolutionRequirement(
  dimensions: ImageDimensions,
  minResolution: number,
): boolean {
  return Math.min(dimensions.width, dimensions.height) >= minResolution;
}

export function calculateOverallImageQuality(metrics: Omit<ImageQualityMetrics, 'overallScore'>): ImageQualityMetrics {
  const overallScore = (metrics.blurScore * 0.4 + metrics.exposureScore * 0.3 + metrics.framingScore * 0.3);
  return { ...metrics, overallScore: Math.round(overallScore * 100) / 100 };
}

export function isBackgroundPureWhite(
  rgbValues: [number, number, number],
  tolerance: number = 5,
): boolean {
  return rgbValues.every(v => v >= 255 - tolerance);
}
