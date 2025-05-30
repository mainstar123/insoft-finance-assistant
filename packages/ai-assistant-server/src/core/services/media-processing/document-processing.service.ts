import { Injectable, Logger } from '@nestjs/common';
import { OpenAIService } from './openai.service';
import { DocumentParsingOptions, DocumentParsingResult } from './interfaces';
import { DocumentProcessingException } from './exceptions';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { CSVLoader } from '@langchain/community/document_loaders/fs/csv';
import { Document } from '@langchain/core/documents';
import { getErrorMessage, normalizeError } from '../../utils/error-handling';

/**
 * Service for processing document files (PDF, CSV)
 */
@Injectable()
export class DocumentProcessingService {
  private readonly logger = new Logger(DocumentProcessingService.name);

  constructor(private readonly openaiService: OpenAIService) {
    this.logger.log('Document processing service initialized');
  }

  /**
   * Parse document from URL
   * @param documentUrl URL of the document file
   * @param options Document parsing options
   * @returns Document parsing result
   */
  async parseDocument(
    documentUrl: string,
    options?: DocumentParsingOptions,
  ): Promise<DocumentParsingResult> {
    const startTime = Date.now();
    this.logger.log(`Parsing document from ${documentUrl}`);

    try {
      // Download the document file
      const documentBuffer =
        await this.openaiService.downloadMedia(documentUrl);

      // Determine document type
      const documentType =
        options?.documentType || this.detectDocumentType(documentUrl);

      // Parse based on document type
      let content = '';
      let tables: any[] = [];
      let pageCount = 0;

      if (documentType === 'pdf') {
        const result = await this.parsePdf(documentBuffer, options);
        content = result.content;
        tables = result.tables;
        pageCount = result.pageCount;
      } else if (documentType === 'csv') {
        const result = await this.parseCsv(documentBuffer, options);
        content = result.content;
        tables = result.tables;
      } else {
        throw new Error(`Unsupported document type: ${documentType}`);
      }

      const processingTime = Date.now() - startTime;
      this.logger.log(`Document parsing completed in ${processingTime}ms`);

      return {
        success: true,
        content,
        tables,
        pageCount,
        processingTime: new Date(),
        metadata: {
          documentUrl,
          documentType,
          processingTimeMs: processingTime,
          ...options,
        },
      };
    } catch (error) {
      this.logger.error(`Error parsing document: ${getErrorMessage(error)}`);
      throw new DocumentProcessingException(normalizeError(error));
    }
  }

  /**
   * Parse PDF document
   * @param pdfBuffer PDF buffer
   * @param options Document parsing options
   * @returns Parsed content, tables, and page count
   */
  private async parsePdf(
    pdfBuffer: Buffer,
    options?: DocumentParsingOptions,
  ): Promise<{ content: string; tables: any[]; pageCount: number }> {
    // Write buffer to temporary file
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `document-${Date.now()}.pdf`);

    this.logger.debug(`Writing PDF to temporary file: ${tempFilePath}`);
    fs.writeFileSync(tempFilePath, pdfBuffer);

    try {
      // Use LangChain's PDFLoader to parse the PDF
      const loader = new PDFLoader(tempFilePath, {
        splitPages: false,
      });

      const docs = await loader.load();

      // Extract content from documents
      let content = docs.map((doc) => doc.pageContent).join('\n\n');

      // Get page count from metadata if available
      let pageCount = 0;
      if (docs && docs.length > 0 && docs[0]?.metadata?.pdf?.totalPages) {
        pageCount = docs[0].metadata.pdf.totalPages;
      } else {
        pageCount = docs.length; // Fallback to number of documents
      }

      this.logger.log(
        `Extracted ${content.length} characters from ${pageCount} pages`,
      );

      // Extract tables if requested
      const tables: any[] = [];
      if (options?.extractTables) {
        // For now, we're using a simple approach to extract tables
        // In a real implementation, we would use a more sophisticated approach
        // such as a table extraction library or an LLM to extract structured data

        // Simple table extraction based on line patterns
        const tableLines = content
          .split('\n')
          .filter((line) => line.includes('|') || line.includes('\t'));

        if (tableLines.length > 0) {
          const table = {
            headers: [] as string[],
            rows: [] as string[][],
          };

          // Try to extract headers from the first line
          const headerLine = tableLines[0];
          if (headerLine) {
            const separator = headerLine.includes('|') ? '|' : '\t';
            const headers = headerLine
              .split(separator)
              .map((h) => h.trim())
              .filter(Boolean);
            table.headers = headers;

            // Extract rows from the rest of the lines
            for (let i = 1; i < tableLines.length; i++) {
              const line = tableLines[i];
              if (line) {
                const cells = line.split(separator).map((cell) => cell.trim());
                if (cells.length > 1) {
                  table.rows.push(cells);
                }
              }
            }

            tables.push(table);
          }
        }
      }

      return { content, tables, pageCount };
    } catch (error) {
      this.logger.error(`Error parsing PDF: ${getErrorMessage(error)}`);
      throw error;
    } finally {
      // Clean up temporary file
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
        this.logger.debug(`Deleted temporary file: ${tempFilePath}`);
      }
    }
  }

  /**
   * Parse CSV document
   * @param csvBuffer CSV buffer
   * @param options Document parsing options
   * @returns Parsed content and tables
   */
  private async parseCsv(
    csvBuffer: Buffer,
    options?: DocumentParsingOptions,
  ): Promise<{ content: string; tables: any[] }> {
    // Write buffer to temporary file
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `document-${Date.now()}.csv`);

    this.logger.debug(`Writing CSV to temporary file: ${tempFilePath}`);
    fs.writeFileSync(tempFilePath, csvBuffer);

    try {
      // Use LangChain's CSVLoader to parse the CSV
      const loader = new CSVLoader(tempFilePath, {
        separator: options?.csvSeparator || ',',
        column: options?.extractColumn,
      });

      const docs = await loader.load();

      // Extract content from documents
      let content = docs.map((doc) => doc.pageContent).join('\n\n');

      this.logger.log(`Extracted ${content.length} characters from CSV`);

      // Extract table structure
      const table = {
        headers: [] as string[],
        rows: [] as any[][],
      };

      // Extract headers from metadata
      if (docs.length > 0 && docs[0]?.metadata) {
        const headerKeys = Object.keys(docs[0].metadata || {}).filter(
          (key) => key !== 'source' && key !== 'line',
        );
        table.headers = headerKeys;
      }

      // Extract rows from documents
      for (const doc of docs) {
        const row: any[] = [];
        for (const header of table.headers) {
          row.push(doc.metadata[header] || '');
        }
        table.rows.push(row);
      }

      return { content, tables: [table] };
    } catch (error) {
      this.logger.error(`Error parsing CSV: ${getErrorMessage(error)}`);
      throw error;
    } finally {
      // Clean up temporary file
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
        this.logger.debug(`Deleted temporary file: ${tempFilePath}`);
      }
    }
  }

  /**
   * Detect document type from URL
   * @param url Document URL
   * @returns Document type
   */
  private detectDocumentType(url: string): 'pdf' | 'csv' {
    const extension = url.split('.').pop()?.toLowerCase();
    if (extension === 'pdf') {
      return 'pdf';
    } else if (extension === 'csv') {
      return 'csv';
    } else {
      // Default to PDF
      return 'pdf';
    }
  }
}
