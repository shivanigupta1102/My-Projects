import { Injectable } from '@nestjs/common';
import pdfParse from 'pdf-parse';

@Injectable()
export class PdfProcessor {
  async extractText(buffer: Buffer): Promise<{ text: string; pageCount: number }> {
    const data = await pdfParse(buffer);
    return {
      text: data.text ?? '',
      pageCount: data.numpages,
    };
  }
}
