import { Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';

export interface ParsedSheet {
  sheetNames: string[];
  rows: Record<string, string | number | boolean | null>[][];
}

@Injectable()
export class CsvProcessor {
  parseBuffer(buffer: Buffer, _mimeType: string): ParsedSheet {
    const workbook = XLSX.read(buffer, {
      type: 'buffer',
      raw: false,
      cellDates: true,
    });
    const sheetNames = workbook.SheetNames;
    const rows: Record<string, string | number | boolean | null>[][] = [];
    for (const name of sheetNames) {
      const sheet = workbook.Sheets[name];
      if (!sheet) continue;
      const json = XLSX.utils.sheet_to_json<Record<string, string | number | boolean | null>>(
        sheet,
        { defval: null },
      );
      rows.push(json);
    }
    return { sheetNames, rows };
  }
}
