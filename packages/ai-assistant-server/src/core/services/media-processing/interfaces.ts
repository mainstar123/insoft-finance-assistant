/**
 * Base interface for media processing options
 */
export interface MediaProcessingOptions {
  userId?: string;
  threadId?: string;
  [key: string]: any;
}

/**
 * Base interface for media processing results
 */
export interface MediaProcessingResult {
  success: boolean;
  error?: string;
  processingTime: Date;
  metadata: Record<string, any>;
}

/**
 * Options for audio transcription
 */
export interface TranscriptionOptions extends MediaProcessingOptions {
  /**
   * Language code (e.g., 'en', 'pt', 'es')
   */
  language?: string;

  /**
   * Prompt to guide the transcription
   */
  prompt?: string;

  /**
   * Temperature for the model
   */
  temperature?: number;

  /**
   * Whether the audio is a voice message
   */
  isVoice?: boolean;

  /**
   * Headers to include in the request when downloading the audio
   */
  headers?: Record<string, string>;

  /**
   * Pre-downloaded audio buffer (to avoid downloading again)
   */
  audioBuffer?: Buffer;
}

/**
 * Result of audio transcription
 */
export interface TranscriptionResult extends MediaProcessingResult {
  text: string;
  language?: string;
}

/**
 * Options for image analysis
 */
export interface ImageAnalysisOptions extends MediaProcessingOptions {
  analysisType?: 'general' | 'receipt' | 'document' | 'transaction';
  maxTokens?: number;
  caption?: string;
  prompt?: string;
}

/**
 * Result of image analysis
 */
export interface ImageAnalysisResult extends MediaProcessingResult {
  description: string;
  entities?: Record<string, any>;
}

/**
 * Options for document parsing
 */
export interface DocumentParsingOptions extends MediaProcessingOptions {
  documentType?: 'pdf' | 'csv';
  extractTables?: boolean;
  extractColumn?: string;
  csvSeparator?: string;
}

/**
 * Result of document parsing
 */
export interface DocumentParsingResult extends MediaProcessingResult {
  content: string;
  tables?: any[];
  pageCount?: number;
}

/**
 * Media content for agent state
 */
export interface MediaContent {
  id: string;
  type: 'transcription' | 'imageAnalysis' | 'documentContent';
  content: string;
  metadata: Record<string, any>;
}
