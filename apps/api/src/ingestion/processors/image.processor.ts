import { Injectable } from '@nestjs/common';
import sharp from 'sharp';

export interface ImageAnalysisResult {
  width: number;
  height: number;
  dominantColors: string[];
  format: string;
}

@Injectable()
export class ImageProcessor {
  async analyze(buffer: Buffer): Promise<ImageAnalysisResult> {
    const meta = await sharp(buffer).metadata();
    const { data, info } = await sharp(buffer)
      .resize(64, 64, { fit: 'inside' })
      .raw()
      .toBuffer({ resolveWithObject: true });

    const colors = this.extractDominantColors(data, info.channels ?? 3);
    return {
      width: meta.width ?? 0,
      height: meta.height ?? 0,
      dominantColors: colors,
      format: meta.format ?? 'unknown',
    };
  }

  private extractDominantColors(
    data: Buffer,
    channels: number,
  ): string[] {
    const buckets = new Map<string, number>();
    const step = Math.max(1, Math.floor(data.length / (channels * 200)));
    for (let i = 0; i < data.length; i += channels * step) {
      const r = data[i] ?? 0;
      const g = data[i + 1] ?? 0;
      const b = data[i + 2] ?? 0;
      const key = `${Math.round(r / 32) * 32},${Math.round(g / 32) * 32},${Math.round(b / 32) * 32}`;
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
    return [...buckets.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([k]) => {
        const [r, g, b] = k.split(',').map((n) => Number.parseInt(n, 10));
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
      });
  }
}
