import { Injectable, Logger } from '@nestjs/common';
import { OpenAIService } from './openai.service';
import { ImageAnalysisOptions, ImageAnalysisResult } from './interfaces';
import { ImageProcessingException } from './exceptions';

/**
 * Service for processing image files
 */
@Injectable()
export class ImageProcessingService {
  private readonly logger = new Logger(ImageProcessingService.name);

  constructor(private readonly openaiService: OpenAIService) {
    this.logger.log('Image processing service initialized');
  }

  /**
   * Analyze image from URL
   * @param imageUrl URL of the image file
   * @param options Image analysis options
   * @returns Image analysis result
   */
  async analyzeImage(
    imageUrl: string,
    options?: ImageAnalysisOptions,
  ): Promise<ImageAnalysisResult> {
    const startTime = Date.now();
    this.logger.log(`Analyzing image from ${imageUrl}`);

    try {
      // Download the image file
      const imageBuffer = await this.openaiService.downloadMedia(imageUrl);

      // Prepare analysis prompt based on type and caption
      const analysisPrompt = this.prepareAnalysisPrompt(options);

      // Analyze using GPT-4 Vision
      const analysis = await this.openaiService.analyzeImage(imageBuffer, {
        ...options,
        prompt: analysisPrompt,
      });

      const processingTime = Date.now() - startTime;
      this.logger.log(`Image analysis completed in ${processingTime}ms`);

      // Extract entities based on analysis type
      let entities = {};
      const analysisType = options?.analysisType || 'general';

      if (analysisType === 'receipt') {
        entities = this.extractReceiptEntities(analysis);
      } else if (analysisType === 'document') {
        entities = this.extractDocumentEntities(analysis);
      } else if (analysisType === 'transaction') {
        entities = this.extractTransactionEntities(analysis);
      }

      return {
        success: true,
        description: analysis,
        entities,
        processingTime: new Date(),
        metadata: {
          imageUrl,
          processingTimeMs: processingTime,
          analysisType: options?.analysisType || 'general',
          caption: options?.caption,
          ...options,
        },
      };
    } catch (error) {
      this.logger.error(
        `Error analyzing image: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new ImageProcessingException(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  /**
   * Prepare analysis prompt based on analysis type and caption
   * @param options Analysis options including type and caption
   * @returns Tailored prompt for image analysis
   */
  private prepareAnalysisPrompt(options?: ImageAnalysisOptions): string {
    const caption = options?.caption ? `Context: ${options.caption}\n\n` : '';

    switch (options?.analysisType) {
      case 'receipt':
        return `${caption}This image contains a receipt. Please extract the following information in a structured format:
1. Merchant/Store name
2. Date of purchase
3. Total amount
4. Individual items with prices (if visible)
5. Payment method (if visible)
6. Any discounts or taxes applied

Be precise with the extracted information and format it clearly.`;

      case 'document':
        return `${caption}This image contains a financial document. Please analyze it and extract:
1. Document type (invoice, statement, contract, etc.)
2. Date(s) mentioned
3. Key financial figures (amounts, totals, balances)
4. Account information (if present)
5. Any important terms or conditions
6. Parties involved

Provide a comprehensive analysis of the document's content.`;

      case 'transaction':
        return `${caption}This image contains information about a financial transaction. Please extract:
1. Transaction type (payment, transfer, withdrawal, deposit)
2. Amount
3. Date and time
4. Sender/recipient information
5. Account details (if visible)
6. Transaction ID or reference number (if visible)
7. Category or purpose of the transaction

Format the information in a structured way that could be used to record this transaction.`;

      default:
        return caption
          ? `${caption}Please describe this image in detail, focusing on any financial information or relevant details visible.`
          : 'Please describe this image in detail, focusing on any financial information or relevant details visible.';
    }
  }

  /**
   * Extract structured entities from receipt analysis
   * @param analysis Raw analysis text
   * @returns Structured receipt data
   */
  private extractReceiptEntities(analysis: string): Record<string, any> {
    const entities: Record<string, any> = {
      merchant: '',
      date: '',
      total: 0,
      items: [],
      paymentMethod: '',
      taxes: 0,
      discounts: 0,
    };

    // Extract merchant name
    const merchantMatch = analysis.match(
      /Merchant(?:\s+name)?(?:\s*:?\s*|\s+is\s+)([^\n.]+)/i,
    );
    if (merchantMatch && merchantMatch[1]) {
      entities.merchant = merchantMatch[1].trim();
    }

    // Extract date
    const dateMatch = analysis.match(/Date(?:\s*:?\s*|\s+is\s+)([^\n.]+)/i);
    if (dateMatch && dateMatch[1]) {
      entities.date = dateMatch[1].trim();
    }

    // Extract total
    const totalMatch = analysis.match(
      /Total(?:\s+amount)?(?:\s*:?\s*|\s+is\s+)([^\n.]+)/i,
    );
    if (totalMatch && totalMatch[1]) {
      const totalStr = totalMatch[1].trim().replace(/[^\d.,]/g, '');
      entities.total = parseFloat(totalStr.replace(',', '.')) || 0;
    }

    // Extract payment method
    const paymentMatch = analysis.match(
      /Payment(?:\s+method)?(?:\s*:?\s*|\s+is\s+)([^\n.]+)/i,
    );
    if (paymentMatch && paymentMatch[1]) {
      entities.paymentMethod = paymentMatch[1].trim();
    }

    // Extract items (more complex)
    const itemsSection = analysis.match(
      /Items?(?:\s*:?\s*)([\s\S]+?)(?:Total|$)/i,
    );
    if (itemsSection && itemsSection[1]) {
      // Look for patterns like "Item name - $10.99" or "Item name: $10.99"
      const itemMatches = Array.from(
        itemsSection[1].matchAll(
          /([^-:]+)(?:-|:)\s*(?:R?\$?\s*)(\d+[.,]\d+)/gi,
        ),
      );

      if (itemMatches && itemMatches.length > 0) {
        for (const match of itemMatches) {
          if (match.length >= 3 && match[1] && match[2]) {
            entities.items.push({
              name: match[1].trim(),
              price: parseFloat(match[2].replace(',', '.')) || 0,
            });
          }
        }
      }
    }

    return entities;
  }

  /**
   * Extract structured entities from document analysis
   * @param analysis Raw analysis text
   * @returns Structured document data
   */
  private extractDocumentEntities(analysis: string): Record<string, any> {
    const entities: Record<string, any> = {
      documentType: this.detectDocumentType(analysis),
      dates: [],
      amounts: [],
      accountInfo: '',
      parties: [],
      hasFinancialData: false,
    };

    // Extract dates using regex for common date formats
    const dateMatches = Array.from(
      analysis.matchAll(/\b(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})\b/g),
    );
    if (dateMatches && dateMatches.length > 0) {
      for (const match of dateMatches) {
        if (match[1] && !entities.dates.includes(match[1])) {
          entities.dates.push(match[1]);
        }
      }
    }

    // Extract amounts (looking for currency patterns)
    const amountMatches = Array.from(
      analysis.matchAll(
        /(?:R?\$|BRL)\s*(\d+(?:[.,]\d+)?)|(\d+(?:[.,]\d+)?)\s*(?:reais|BRL)/gi,
      ),
    );
    if (amountMatches && amountMatches.length > 0) {
      for (const match of amountMatches) {
        const amount = match[1] || match[2];
        if (amount) {
          entities.amounts.push(parseFloat(amount.replace(',', '.')) || 0);
        }
      }
    }

    // Check for account information
    const accountMatch = analysis.match(
      /(?:account|conta)(?:\s+number|\s+nº)?(?:\s*:?\s*)([^\n.]+)/i,
    );
    if (accountMatch && accountMatch[1]) {
      entities.accountInfo = accountMatch[1].trim();
    }

    // Extract parties involved
    const partyMatches = Array.from(
      analysis.matchAll(
        /(?:from|to|sender|recipient|pagador|beneficiário|cliente|fornecedor)(?:\s*:?\s*)([^\n.]+)/gi,
      ),
    );
    if (partyMatches && partyMatches.length > 0) {
      for (const match of partyMatches) {
        if (match[1] && !entities.parties.includes(match[1].trim())) {
          entities.parties.push(match[1].trim());
        }
      }
    }

    // Determine if it has financial data
    entities.hasFinancialData =
      entities.amounts.length > 0 ||
      analysis.toLowerCase().includes('financial') ||
      analysis.toLowerCase().includes('finance') ||
      analysis.toLowerCase().includes('payment') ||
      analysis.toLowerCase().includes('pagamento') ||
      analysis.toLowerCase().includes('valor');

    return entities;
  }

  /**
   * Extract structured entities from transaction analysis
   * @param analysis Raw analysis text
   * @returns Structured transaction data
   */
  private extractTransactionEntities(analysis: string): Record<string, any> {
    const entities: Record<string, any> = {
      transactionType: '',
      amount: 0,
      date: '',
      time: '',
      sender: '',
      recipient: '',
      accountDetails: '',
      reference: '',
      category: '',
    };

    // Extract transaction type
    const typeMatch = analysis.match(
      /Transaction(?:\s+type)?(?:\s*:?\s*|\s+is\s+)([^\n.]+)/i,
    );
    if (typeMatch && typeMatch[1]) {
      entities.transactionType = typeMatch[1].trim();
    } else {
      // Try to infer type from keywords
      const lowerAnalysis = analysis.toLowerCase();
      if (
        lowerAnalysis.includes('payment') ||
        lowerAnalysis.includes('pagamento')
      ) {
        entities.transactionType = 'payment';
      } else if (
        lowerAnalysis.includes('transfer') ||
        lowerAnalysis.includes('transferência')
      ) {
        entities.transactionType = 'transfer';
      } else if (
        lowerAnalysis.includes('deposit') ||
        lowerAnalysis.includes('depósito')
      ) {
        entities.transactionType = 'deposit';
      } else if (
        lowerAnalysis.includes('withdrawal') ||
        lowerAnalysis.includes('saque')
      ) {
        entities.transactionType = 'withdrawal';
      }
    }

    // Extract amount
    const amountMatch = analysis.match(/Amount(?:\s*:?\s*|\s+is\s+)([^\n.]+)/i);
    if (amountMatch && amountMatch[1]) {
      const amountStr = amountMatch[1].trim().replace(/[^\d.,]/g, '');
      entities.amount = parseFloat(amountStr.replace(',', '.')) || 0;
    } else {
      // Try to find currency patterns
      const currencyMatch = analysis.match(
        /(?:R?\$|BRL)\s*(\d+(?:[.,]\d+)?)|(\d+(?:[.,]\d+)?)\s*(?:reais|BRL)/i,
      );
      if (currencyMatch) {
        const amount = currencyMatch[1] || currencyMatch[2];
        if (amount) {
          entities.amount = parseFloat(amount.replace(',', '.')) || 0;
        }
      }
    }

    // Extract date
    const dateMatch = analysis.match(/Date(?:\s*:?\s*|\s+is\s+)([^\n.]+)/i);
    if (dateMatch && dateMatch[1]) {
      entities.date = dateMatch[1].trim();
    } else {
      // Try to find date patterns
      const datePatternMatch = analysis.match(
        /\b(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})\b/,
      );
      if (datePatternMatch && datePatternMatch[1]) {
        entities.date = datePatternMatch[1];
      }
    }

    // Extract time
    const timeMatch = analysis.match(/Time(?:\s*:?\s*|\s+is\s+)([^\n.]+)/i);
    if (timeMatch && timeMatch[1]) {
      entities.time = timeMatch[1].trim();
    } else {
      // Try to find time patterns
      const timePatternMatch = analysis.match(
        /\b(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?)\b/i,
      );
      if (timePatternMatch && timePatternMatch[1]) {
        entities.time = timePatternMatch[1];
      }
    }

    // Extract sender
    const senderMatch = analysis.match(
      /(?:Sender|From|Origin)(?:\s*:?\s*|\s+is\s+)([^\n.]+)/i,
    );
    if (senderMatch && senderMatch[1]) {
      entities.sender = senderMatch[1].trim();
    }

    // Extract recipient
    const recipientMatch = analysis.match(
      /(?:Recipient|To|Destination)(?:\s*:?\s*|\s+is\s+)([^\n.]+)/i,
    );
    if (recipientMatch && recipientMatch[1]) {
      entities.recipient = recipientMatch[1].trim();
    }

    // Extract account details
    const accountMatch = analysis.match(
      /(?:Account|Conta)(?:\s+details?|\s+information)?(?:\s*:?\s*|\s+is\s+)([^\n.]+)/i,
    );
    if (accountMatch && accountMatch[1]) {
      entities.accountDetails = accountMatch[1].trim();
    }

    // Extract reference/ID
    const referenceMatch = analysis.match(
      /(?:Reference|ID|Transaction ID|Number)(?:\s*:?\s*|\s+is\s+)([^\n.]+)/i,
    );
    if (referenceMatch && referenceMatch[1]) {
      entities.reference = referenceMatch[1].trim();
    }

    // Extract category/purpose
    const categoryMatch = analysis.match(
      /(?:Category|Purpose|Reason)(?:\s*:?\s*|\s+is\s+)([^\n.]+)/i,
    );
    if (categoryMatch && categoryMatch[1]) {
      entities.category = categoryMatch[1].trim();
    }

    return entities;
  }

  /**
   * Detect document type from analysis
   * @param analysis Raw analysis text
   * @returns Document type
   */
  private detectDocumentType(analysis: string): string {
    const lowerAnalysis = analysis.toLowerCase();

    if (
      lowerAnalysis.includes('invoice') ||
      lowerAnalysis.includes('fatura') ||
      lowerAnalysis.includes('nota fiscal')
    ) {
      return 'invoice';
    } else if (
      lowerAnalysis.includes('statement') ||
      lowerAnalysis.includes('extrato') ||
      lowerAnalysis.includes('bank statement')
    ) {
      return 'statement';
    } else if (
      lowerAnalysis.includes('receipt') ||
      lowerAnalysis.includes('recibo') ||
      lowerAnalysis.includes('comprovante')
    ) {
      return 'receipt';
    } else if (
      lowerAnalysis.includes('contract') ||
      lowerAnalysis.includes('contrato')
    ) {
      return 'contract';
    } else if (
      lowerAnalysis.includes('bill') ||
      lowerAnalysis.includes('conta a pagar')
    ) {
      return 'bill';
    } else {
      return 'unknown';
    }
  }
}
