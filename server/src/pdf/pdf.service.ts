import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';

@Injectable()
export class PdfService {
  async generatePdf(options: {
    title: string;
    data: any;
    templateFn: (doc: typeof PDFDocument.prototype, data: any) => void;
  }): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument();
      const buffers: Buffer[] = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Add title
      doc.fontSize(24).text(options.title, { align: 'center' });
      doc.moveDown();

      // Call the template function
      options.templateFn(doc, options.data);

      doc.end();
    });
  }
}