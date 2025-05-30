import { Injectable, Logger } from '@nestjs/common';
import { AudioProcessingService } from './audio-processing.service';
import { ImageProcessingService } from './image-processing.service';
import { DocumentProcessingService } from './document-processing.service';
import {
  MediaProcessingOptions,
  TranscriptionResult,
  ImageAnalysisResult,
  DocumentParsingResult,
  ImageAnalysisOptions,
  TranscriptionOptions,
} from './interfaces';
import {
  MediaProcessingException,
  UnsupportedMediaTypeException,
} from './exceptions';

/**
 * Service for processing different types of media
 */
@Injectable()
export class MediaProcessingService {
  private readonly logger = new Logger(MediaProcessingService.name);

  constructor(
    private readonly audioService: AudioProcessingService,
    private readonly imageService: ImageProcessingService,
    private readonly documentService: DocumentProcessingService,
  ) {
    this.logger.log('Media processing service initialized');
  }

  /**
   * Process media based on type
   * @param mediaUrl URL of the media file
   * @param mediaType Type of media (audio, image, document)
   * @param options Processing options
   * @returns Processing result
   */
  async processMedia(
    mediaUrl: string,
    mediaType: string,
    options?: MediaProcessingOptions,
  ): Promise<
    TranscriptionResult | ImageAnalysisResult | DocumentParsingResult
  > {
    this.logger.log(`Processing ${mediaType} from ${mediaUrl}`);

    try {
      switch (mediaType.toLowerCase()) {
        case 'audio':
          return await this.audioService.transcribeAudio(mediaUrl, options);
        case 'image':
          return await this.imageService.analyzeImage(mediaUrl, options);
        case 'receipt':
          return await this.imageService.analyzeImage(mediaUrl, {
            ...options,
            analysisType: 'receipt',
          });
        case 'transaction':
          return await this.imageService.analyzeImage(mediaUrl, {
            ...options,
            analysisType: 'transaction',
          });
        case 'document':
        case 'pdf':
          return await this.documentService.parseDocument(mediaUrl, {
            ...options,
            documentType: 'pdf',
          });
        case 'csv':
          return await this.documentService.parseDocument(mediaUrl, {
            ...options,
            documentType: 'csv',
          });
        default:
          throw new UnsupportedMediaTypeException(mediaType);
      }
    } catch (error) {
      if (error instanceof MediaProcessingException) {
        throw error;
      }
      this.logger.error(
        `Error processing ${mediaType}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new MediaProcessingException(
        mediaType,
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  /**
   * Transcribe audio
   * @param audioUrl URL of the audio file
   * @param options Transcription options
   * @returns Transcription result
   */
  async transcribeAudio(
    audioUrl: string,
    options?: TranscriptionOptions,
  ): Promise<TranscriptionResult> {
    return this.audioService.transcribeAudio(audioUrl, options);
  }

  /**
   * Analyze image
   * @param imageUrl URL of the image file
   * @param options Image analysis options
   * @returns Image analysis result
   */
  async analyzeImage(
    imageUrl: string,
    options?: ImageAnalysisOptions,
  ): Promise<ImageAnalysisResult> {
    return this.imageService.analyzeImage(imageUrl, options);
  }

  /**
   * Analyze receipt image
   * @param imageUrl URL of the receipt image
   * @param options Image analysis options
   * @returns Image analysis result with receipt data
   */
  async analyzeReceipt(
    imageUrl: string,
    options?: ImageAnalysisOptions,
  ): Promise<ImageAnalysisResult> {
    return this.imageService.analyzeImage(imageUrl, {
      ...options,
      analysisType: 'receipt',
    });
  }

  /**
   * Analyze transaction image
   * @param imageUrl URL of the transaction image
   * @param options Image analysis options
   * @returns Image analysis result with transaction data
   */
  async analyzeTransaction(
    imageUrl: string,
    options?: ImageAnalysisOptions,
  ): Promise<ImageAnalysisResult> {
    return this.imageService.analyzeImage(imageUrl, {
      ...options,
      analysisType: 'transaction',
    });
  }

  /**
   * Parse document
   * @param documentUrl URL of the document file
   * @param options Document parsing options
   * @returns Document parsing result
   */
  async parseDocument(
    documentUrl: string,
    options?: MediaProcessingOptions,
  ): Promise<DocumentParsingResult> {
    return this.documentService.parseDocument(documentUrl, options);
  }

  /**
   * Detect media type from URL
   * @param url Media URL
   * @returns Detected media type
   */
  detectMediaType(url: string): string {
    const extension = url.split('.').pop()?.toLowerCase();

    if (!extension) {
      return 'unknown';
    }

    if (['mp3', 'wav', 'ogg', 'm4a'].includes(extension)) {
      return 'audio';
    } else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
      return 'image';
    } else if (extension === 'pdf') {
      return 'pdf';
    } else if (extension === 'csv') {
      return 'csv';
    } else {
      return 'unknown';
    }
  }
}
