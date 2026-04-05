declare module 'pdf-parse' {
  import { Buffer } from 'buffer';

  function pdfParse(dataBuffer: Buffer): Promise<{
    numpages: number;
    text: string;
  }>;

  export default pdfParse;
}
