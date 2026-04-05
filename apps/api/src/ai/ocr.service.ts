import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { createWorker, Worker } from 'tesseract.js';

@Injectable()
export class OcrService implements OnModuleDestroy {
  private worker: Worker | null = null;

  private async getWorker(): Promise<Worker> {
    if (!this.worker) {
      this.worker = await createWorker('eng');
    }
    return this.worker;
  }

  async extractText(imageBuffer: Buffer): Promise<{ text: string; confidence: number }> {
    const w = await this.getWorker();
    const {
      data: { text, confidence },
    } = await w.recognize(imageBuffer);
    return { text, confidence: confidence / 100 };
  }

  async onModuleDestroy(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
}
